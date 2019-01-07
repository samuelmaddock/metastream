import { EventEmitter } from 'events'
import * as IPCStream from 'electron-ipc-stream'
import * as SimpleWebSocketServer from 'simple-websocket/server'
import * as swarm from 'swarm-peer-server'
import log from 'browser/log'

let connId = 0

interface IServerOptions {
  webContents: Electron.WebContents
  port: number
  publicKey: Buffer
  secretKey: Buffer
}

export class WebSocketServer {
  private webContents: Electron.WebContents
  private hostPublicKey: Buffer
  private hostSecretKey: Buffer
  private server: typeof SimpleWebSocketServer | null = null
  private connections: Map<string, WebSocketProxy> = new Map()

  constructor(opts: IServerOptions) {
    this.webContents = opts.webContents
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
    const esocket = new swarm.EncryptedSocket(socket, this.hostPublicKey, this.hostSecretKey)
    esocket.connect()

    esocket.once('connection', () => {
      log.debug(`Authenticated connection (${addr})`)
      const peerKey = Buffer.from((esocket as any).peerKey)
      const peerKeyStr = peerKey.toString('hex')
      const id = ++connId
      const streamChannel = `websocket/${peerKeyStr}/${id}`
      const stream = new IPCStream(streamChannel, this.webContents)
      ;(esocket as any).destroy(false)

      const conn = new WebSocketProxy(socket, stream)
      this.connections.set(peerKeyStr, conn)

      conn.once('close', () => {
        log.debug(`Conn closed for ${peerKeyStr}`)
        this.connections.delete(peerKeyStr)
        this.webContents.send(`websocket-peer-close-${peerKeyStr}`)
      })

      // TODO: send unique connection ID in case same peer connects twice
      this.webContents.send('websocket-peer-init', {
        streamId: id,
        peerId: peerKeyStr,
        address: addr
      })
    })

    esocket.once('error', err => {
      log.debug(`Authentication error (${addr})`, err)
    })
  }

  close() {
    for (let connEntry of this.connections) {
      connEntry[1].close()
    }
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
    this.socket.pipe(this.stream)
    this.stream.pipe(this.socket)
  }

  close = () => {
    if (this.socket) {
      this.socket.unpipe()
      this.socket.destroy()
      this.socket = null
    }
    if (this.stream) {
      this.stream.unpipe()
      this.stream.end()
      this.stream = null
    }
    this.emit('close')
  }
}
