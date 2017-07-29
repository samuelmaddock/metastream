import SimplePeer, { SignalData } from "simple-peer";
import { EventEmitter } from 'events';
import { steamworks } from "steam";
import { NetUniqueId, NetConnection, NetServer } from "lobby/types";
import { Deferred } from "utils/async";

export type SignalData = SignalData;

/** WebRTC server. */
export class RTCServer extends NetServer {
  // Dependencies
  private peerCoord: IRTCPeerCoordinator;

  constructor(peerCoord: IRTCPeerCoordinator) {
    super();
    this.peerCoord = peerCoord;
    this.peerCoord.on('connection', this.onConnection);
  }

  private onConnection = (peer: RTCPeerConn): void => {
    this.connect(peer);
  }

  close(): void {
    this.peerCoord.removeListener('connection', this.onConnection);
    super.close();
  }
}


/** WebRTC peer connection. */
export class RTCPeerConn extends NetConnection {
  private peer: SimplePeer.Instance;
  private signalData?: SignalData;
  private signalDeferred: Deferred<SignalData> = new Deferred();

  constructor(id: NetUniqueId, peer: SimplePeer.Instance) {
    super(id);
    this.peer = peer;
    this.setup();
  }

  private setup(): void {
    this.peer.on('close', this.close);
    this.peer.on('data', this.receive);
    this.peer.on('signal', this.onSignal);
  }

  private onSignal = (signal: SignalData) => {
    this.signalData = signal;
    this.signalDeferred.resolve(signal);
  }

  protected onClose(): void {
    this.peer.removeAllListeners();
    this.peer.destroy();
    super.onClose();
  }

  async getSignal(): Promise<SignalData> {
    return this.signalDeferred.promise;
  }

  signal(signal: SignalData): void {
    if (this.peer) {
      this.peer.signal(signal);
    }
  }

  send(data: Buffer): void {
    this.peer.send(data);
  }

  getIP(): string {
    return this.peer.address().address;
  }

  getPort(): string {
    return this.peer.address().port;
  }
}

/**
 * Coordinates signaling of WebRTC peers.
 */
export interface IRTCPeerCoordinator extends EventEmitter {
  /** Send offer/answer signaling data. */
  signal(signal: string): void;

  /** Subscribe to peer connections. */
  on(eventName: 'connection', listener: (peer: RTCPeerConn) => void): this;
}
