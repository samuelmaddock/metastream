import SimplePeer, { SignalData } from 'simple-peer'
import { Deferred } from 'utils/async'

import NetConnection, { NetUniqueId } from './connection'
import { RECONNECT_TIMEOUT } from 'constants/network'

/** WebRTC peer connection. */
export class RTCPeerConn extends NetConnection {
  private peer: SimplePeer.Instance
  private signalDeferred: Deferred<SignalData> = new Deferred()

  constructor(id: NetUniqueId, peer: SimplePeer.Instance) {
    super(id, peer)
    this.peer = peer
    ;(this.peer as any).reconnectTimer = RECONNECT_TIMEOUT

    this.peer.on('close', this.close)
    this.peer.on('error', this.onError)
    this.peer.on('iceStateChange', this.onStateChange)
    this.peer.once('connect', this.onConnect)

    if ((this.peer as any).connected) {
      this.onConnect()
    } else {
      this.peer.on('signal', this.onSignal)
    }
  }

  private onSignal = (signal: SignalData) => {
    this.signalDeferred.resolve(signal)
    this.emit('signal', signal)
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

  receive(data: Buffer): void {
    // HACK: Workaround simple-peer bug where data is received before
    // 'connect' event
    if (!this.connected) {
      console.warn('Received RTCDataChannel data prior to connect event.')
      this.once('connect', () => this.receive(data))
      return
    }

    super.receive(data)
  }

  getIP(): string {
    return this.peer.address().address
  }

  getPort(): string {
    return this.peer.address().port
  }
}
