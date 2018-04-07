const { ipcRenderer } = chrome
import * as WebSocket from 'simple-websocket'
import * as IPCStream from 'electron-ipc-stream/renderer'
import { WEBSOCKET_PORT_DEFAULT } from 'constants/network'
import { isP2PHash } from 'utils/network'
import { ipcRendererRpc } from 'utils/ipcRenderer'

type SimpleWebSocket = typeof WebSocket
// TODO: timeout

export function connectToWebSocketServer(ip: string) {
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
      console.debug(`Received public key`, hostPublicKey.toString('hex'))

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

      // TODO: we're done! :)
      console.debug('Connected and authed!')
    })

    socket.once('error', onError)
    socket.once('close', onError)
  })
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
    if (success) {
      resolve()
    } else {
      reject()
    }
  })
}
