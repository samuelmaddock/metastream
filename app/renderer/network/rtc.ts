import SimplePeer, { SignalData } from 'simple-peer'
import { Deferred } from 'utils/async'

import NetConnection, { NetUniqueId } from './connection'
import { RECONNECT_TIMEOUT } from 'constants/network'

/** WebRTC peer connection. */
export class RTCPeerConn extends NetConnection {
  private peer: SimplePeer.Instance
  private signalDeferred: Deferred<SignalData> = new Deferred()

  constructor(id: NetUniqueId, peer: SimplePeer.Instance) {
    super(id)
    this.peer = peer
    ;(this.peer as any).reconnectTimer = RECONNECT_TIMEOUT

    this.peer.on('close', this.close)
    this.peer.on('error', this.onError)
    this.peer.on('data', this.onData)
    this.peer.on('iceStateChange', this.onStateChange)
    this.peer.on('signal', this.onSignal)
    this.peer.once('connect', this.onConnect)
  }

  private onSignal = (signal: SignalData) => {
    this.signalDeferred.resolve(signal)
    this.emit('signal', signal)
  }

  private onData = (data: Buffer): void => {
    // HACK: Workaround simple-peer bug where data is received before
    // 'connect' event
    if (!this.connected) {
      this.once('connect', () => this.receive(data))
      return
    }

    this.receive(data)
  }

  private onStateChange = (state: RTCIceConnectionState) => {
    if (state === 'disconnected') {
      this.emit('disconnect')
      this.once('connect', () => this.emit('reconnect'))
    }
  }

  protected onClose(): void {
    super.onClose()
    this.peer.destroy()
    this.peer.removeAllListeners()
  }

  async getSignal(): Promise<SignalData> {
    return this.signalDeferred.promise
  }

  signal(signal: SignalData): void {
    if (this.peer) {
      this.peer.signal(signal)
    }
  }

  send(data: Buffer): void {
    this.peer.send(data)
  }

  getIP(): string {
    return this.peer.address().address
  }

  getPort(): string {
    return this.peer.address().port
  }
}
