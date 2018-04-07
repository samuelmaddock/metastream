import { EventEmitter } from 'events'
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
  private connections: Map<string, WebSocketProxy> = new Map()

  constructor(opts: IServerOptions) {
    this.hostPublicKey = opts.publicKey
    this.hostSecretKey = opts.secretKey

    this.server = new SimpleWebSocketServer({ port: opts.port })
    this.server.on('connection', this.onConnection)
  }

  private onConnection = (socket: any) => {
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
      const peerKey = (esocket as any).peerKey as Buffer
      const peerKeyStr = peerKey.toString('hex')
      const win = BrowserWindow.getAllWindows()[0]
      const streamChannel = `websocket/${peerKeyStr}`
      const stream = new IPCStream(streamChannel, win)

      const conn = new WebSocketProxy(socket, stream)
      this.connections.set(peerKeyStr, conn)

      conn.once('close', () => {
        this.connections.delete(peerKeyStr)
        win.webContents.send(`websocket-peer-close-${peerKeyStr}`)
      })

      // TODO: send unique connection ID in case same peer connects twice
      win.webContents.send('websocket-peer-init', peerKeyStr)
    })

    esocket.once('error', err => {
      log.debug(`Authentication error (${addr})`, err)
    })
  }

  close() {
    // for (let connEntry of this.connections) {
    //   connEntry[1].close()
    // }
    this.connections.clear()

    if (this.server) {
      this.server.close()
      this.server = null
    }
  }
}

class WebSocketProxy extends EventEmitter {
  constructor(private socket: any, private stream: any) {
    super()
    this.socket.once('close', this.close)
    this.socket.on('data', this.receive)
    this.stream.on('data', this.write)
  }

  private receive(data: Buffer) {
    this.stream.write(data)
  }

  private write(data: Buffer) {
    this.socket.write(data)
  }

  close = () => {
    this.socket.removeListener('data', this.receive)
    this.stream.removeListener('data', this.write)
    this.stream.end()
    this.emit('close')
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
