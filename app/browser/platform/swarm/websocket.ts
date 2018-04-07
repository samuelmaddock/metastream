import { ipcMain, BrowserWindow } from 'electron'
import * as IPCStream from 'electron-ipc-stream'
import * as SimpleWebSocketServer from 'simple-websocket/server'
import * as swarm from 'swarm-peer-server'
import { getKeyPair } from './identity'
import log from 'browser/log'

interface IServerOptions {
  port: number
  publicKey: Buffer
  secretKey: Buffer
}

export class WebSocketServer {
  private hostPublicKey: Buffer
  private hostSecretKey: Buffer
  private server: typeof SimpleWebSocketServer | null = null

  constructor(opts: IServerOptions) {
    this.hostPublicKey = opts.publicKey
    this.hostSecretKey = opts.secretKey

    this.server = new SimpleWebSocketServer({ port: opts.port })
    this.server.once('connection', (socket: any) => {
      const addr = socket._ws._socket.remoteAddress
      log.debug(`New WebSocket connection (${addr})`)

      /*
      1. send public key
      2. setup EncryptedSocket, perform auth
      3. create renderer proxy socket
      4. proxy data to proxy socket
      5. listen for proxy socket close event
      */
      socket.write(this.hostPublicKey)

      log.debug(`Authenticating connection... (${addr})`)
      const keypair = getKeyPair()
      const esocket = new swarm.EncryptedSocket(socket, keypair.publicKey, keypair.secretKey)
      esocket.connect()

      esocket.once('connection', () => {
        log.debug(`Authenticated connection (${addr})`)
      })

      esocket.once('error', err => {
        log.debug(`Authentication error (${addr})`, err)
      })
    })
  }

  close() {
    if (this.server) {
      this.server.close()
      this.server = null
    }
  }
}

ipcMain.on(
  'create-auth-stream',
  (event: Electron.Event, ipcId: number, hostPublicKeyStr: string) => {
    log.debug(`create-auth-stream`)

    const streamWin = BrowserWindow.getAllWindows()[0]
    const streamChannel = `auth/${hostPublicKeyStr}`
    const stream = new IPCStream(streamChannel, streamWin)
    stream.destroy = () => {}

    const hostPublicKey = Buffer.from(hostPublicKeyStr, 'hex')

    log.debug(`create-auth-stream: connecting to host`)

    // create EncryptedSocket and perform auth
    const keypair = getKeyPair()
    const socket = new swarm.EncryptedSocket(stream, keypair.publicKey, keypair.secretKey)
    socket.connect(hostPublicKey)

    // TODO: close socket?
    socket.once('connection', () => {
      log.debug('Connected to auth')
      stream.end()
      event.sender.send('create-auth-stream-result', ipcId, true)
    })

    socket.once('error', err => {
      log.error(err)
      stream.end()
      event.sender.send('create-auth-stream-result', ipcId, false)
    })
  }
)
