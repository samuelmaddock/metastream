const { ipcRenderer } = chrome

import { NetConnection, NetServer, NetUniqueId } from 'renderer/network'
import { PeerCoordinator } from 'renderer/network/server'

import { PlatformService } from '../index'

import * as WebSocket from 'simple-websocket'
import * as IPCStream from 'electron-ipc-stream/renderer'
import { WEBSOCKET_PORT_DEFAULT } from 'constants/network'
import { isP2PHash } from 'utils/network'
import { ipcRendererRpc } from 'utils/ipcRenderer'

type SimpleWebSocket = typeof WebSocket

export class WebSocketClientCoordinator extends PeerCoordinator {
  connect(ip: string) {
    // TODO: timeout
    return new Promise<SimpleWebSocket>((resolve, reject) => {
      const hasPort = !isNaN(ip.split(':').pop() || ('' as any))
      if (!hasPort) {
        ip = `${ip}:${WEBSOCKET_PORT_DEFAULT}`
      }

      const addr = `ws://${ip}`
      const socket = new WebSocket(addr)

      const cleanup = () => {
        socket.removeListener('error', onError)
        socket.removeListener('close', onError)
      }

      const onError = (err?: Error) => {
        cleanup()
        socket.destroy()
        reject(err)
      }

      /** Get incoming message when received. */
      const read = () => {
        return new Promise<Buffer>(resolve => {
          const err = (e: Error) => reject(e)
          socket.once('data', (data: Uint8Array) => {
            socket.removeListener('error', err)
            const buf = Buffer.from(data as any)
            resolve(buf)
          })
          socket.once('error', err)
        })
      }

      socket.on('connect', async () => {
        console.debug(`Connected to WS`)
        const hostPublicKey = await read()
        const hostPublicKeyStr = hostPublicKey.toString('hex')
        console.debug(`Received public key: ${hostPublicKeyStr}`)

        if (!isP2PHash(hostPublicKey.toString('hex'))) {
          onError()
          return
        }

        try {
          await authWS(socket, hostPublicKey)
        } catch (e) {
          onError(e)
          return
        }

        console.debug('Connected and authed!')
        cleanup()

        const netId = new NetUniqueId(hostPublicKeyStr)
        const conn = new WebSocketClientConnection(netId, socket)
        this.emit('connection', conn)

        resolve()
      })

      socket.once('error', onError)
      socket.once('close', onError)
    })
  }

  close() {}
}

function authWS(socket: SimpleWebSocket, hostPublicKey: Buffer) {
  return new Promise(async (resolve, reject) => {
    /*
    1. Setup IPC stream proxy
    2. Perform auth over IPC
    */
    const hostId = hostPublicKey.toString('hex')
    const streamChannel = `auth/${hostId}`
    const stream = new IPCStream(streamChannel)

    // Feed socket data into stream
    socket.pipe(stream)

    // Feed stream data back into socket
    stream.pipe(socket)

    const success = await ipcRendererRpc<boolean>('create-auth-stream', hostId)

    // HACK: FIXME: ending stream and unpiping socket fucks things up
    // This might leak memory

    // socket.unpipe(stream)
    stream.unpipe()
    // stream.end()

    if (success) {
      resolve()
    } else {
      reject()
    }
  })
}

export class WebSocketClientConnection extends NetConnection {
  private socket: SimpleWebSocket
  private ip?: string

  constructor(id: NetUniqueId, socket: SimpleWebSocket) {
    super(id)
    this.socket = socket

    this.socket.once('close', this.close)
    this.socket.on('error', this.onError)
    this.socket.on('data', this.receive)
  }

  protected onClose(): void {
    this.socket.destroy()
    super.onClose()
  }

  send(data: Buffer): void {
    this.socket.write(data)
  }

  getIP(): string {
    if (!this.ip) {
      try {
        this.ip = this.socket._ws._socket.remoteAddress
      } catch (e) {
        // ignore
      } finally {
        this.ip = this.ip || ''
      }
    }
    return this.ip
  }

  getPort(): string {
    return '' // TODO
  }
}
