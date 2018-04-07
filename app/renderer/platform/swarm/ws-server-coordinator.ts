const { ipcRenderer } = chrome

import { NetConnection, NetServer, NetUniqueId } from 'renderer/network'
import { PeerCoordinator } from 'renderer/network/server'

import * as IPCStream from 'electron-ipc-stream/renderer'

export class WebSocketServerCoordinator extends PeerCoordinator {
  constructor() {
    super()
    ipcRenderer.on('websocket-peer-init', this.onInitPeer)
  }

  private onInitPeer = (event: Electron.Event, peerId: string) => {
    const streamChannel = `websocket/${peerId}`
    const stream = new IPCStream(streamChannel)

    const netId = new NetUniqueId(peerId)
    const conn = new WebSocketProxyConnection(netId, stream)
    this.emit('connection', conn)
  }

  close() {
    ipcRenderer.removeListener('websocket-peer-init', this.onInitPeer)
  }
}

export class WebSocketProxyConnection extends NetConnection {
  private stream: typeof IPCStream

  constructor(id: NetUniqueId, stream: typeof IPCStream) {
    super(id)
    this.stream = stream
    this.stream.on('data', this.receive)
    ipcRenderer.on(`websocket-peer-close-${id}`, this.close)
  }

  protected onClose(): void {
    ipcRenderer.removeListener(`websocket-peer-close-${this.id}`, this.close)
    this.stream.end()
    super.onClose()
  }

  send(data: Buffer): void {
    this.stream.write(data)
  }
  getIP(): string {
    // TODO
    return ''
  }
  getPort(): string {
    // TODO
    return ''
  }
}
