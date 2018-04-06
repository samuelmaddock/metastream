import * as WebSocket from 'simple-websocket'

export function connectToWebSocketServer(ip: string) {
  return new Promise<typeof WebSocket>((resolve, reject) => {
    const addr = `ws://${ip}`
    const socket = new WebSocket(addr)

    const onError = (err: Error) => {
      reject(err)
    }

    socket.on('connect', () => {
      socket.send('yo!')
    })

    socket.on('data', (data: any) => {
      console.debug(`got data: ${data}`)
      reject()
      // TODO: auth handshake, remove error listener
    })

    socket.once('error', onError)
  })
}
