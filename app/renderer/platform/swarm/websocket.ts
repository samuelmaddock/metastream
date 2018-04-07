import * as WebSocket from 'simple-websocket'
import { WEBSOCKET_PORT_DEFAULT } from '../../../constants/network'

export function connectToWebSocketServer(ip: string) {
  return new Promise<typeof WebSocket>((resolve, reject) => {
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

    socket.on('connect', async () => {
      socket.send('yo!')

      // try {
      //   await authWebSocket(socket)
      // } catch (e) {
      //   onError(e)
      //   return
      // }
      // cleanup()
      // resolve(socket)
    })

    socket.on('data', (data: any) => {
      console.debug(`got data: ${data}`)
      onError()
      // TODO: auth handshake, remove error listener
    })

    socket.once('error', onError)
    socket.once('close', onError)
  })
}
