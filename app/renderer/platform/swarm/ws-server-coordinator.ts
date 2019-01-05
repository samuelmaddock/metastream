import { ipcRenderer } from 'electron'
import { NetConnection, NetUniqueId } from 'renderer/network'
import { PeerCoordinator } from 'renderer/network/server'

import * as IPCStream from 'electron-ipc-stream'

export class WebSocketServerCoordinator extends PeerCoordinator {
  constructor() {
    super()
    ipcRenderer.on('websocket-peer-init', this.onInitPeer)
  }

  private onInitPeer = (event: Electron.Event, peerInfo: any) => {
    const streamChannel = `websocket/${peerInfo.peerId}/${peerInfo.streamId}`
    const stream = new IPCStream(streamChannel)

    const netId = new NetUniqueId(peerInfo.peerId)
    const conn = new WebSocketProxyConnection(netId, stream, peerInfo.address)
    this.emit('connection', conn)
  }

  close() {
    ipcRenderer.removeListener('websocket-peer-init', this.onInitPeer)
  }
}

export class WebSocketProxyConnection extends NetConnection {
  private stream: typeof IPCStream

  constructor(id: NetUniqueId, stream: typeof IPCStream, private ip: string) {
    super(id, stream)
    this.stream = stream
    ipcRenderer.on(`websocket-peer-close-${id}`, this.close)
  }

  protected onClose(): void {
    ipcRenderer.removeListener(`websocket-peer-close-${this.id}`, this.close)
    this.stream.end()
    super.onClose()
  }
  getIP(): string {
    return this.ip
  }
  getPort(): string {
    // TODO
    return ''
  }
}
