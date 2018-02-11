import SimplePeer, { SignalData } from 'simple-peer';
import { EventEmitter } from 'events';
import { Deferred } from 'utils/async';

import NetConnection, { NetUniqueId } from './connection';
import { NetServer } from 'renderer/network';
import { INetServerOptions } from 'renderer/network/server';

export type SignalData = SignalData;

interface IRTCServerOptions extends INetServerOptions {
  peerCoord: IRTCPeerCoordinator;
}

/** WebRTC server. */
export class RTCServer extends NetServer {
  // Dependencies
  private peerCoord: IRTCPeerCoordinator;

  constructor(opts: IRTCServerOptions) {
    super(opts);
    this.peerCoord = opts.peerCoord;
    this.peerCoord.on('connection', this.onConnection);
  }

  private onConnection = (peer: RTCPeerConn): void => {
    this.connect(peer);
  };

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

    this.peer.on('close', this.close);
    this.peer.on('error', this.onError);
    this.peer.on('data', this.onData);
    this.peer.on('signal', this.onSignal);
    this.peer.once('connect', this.onConnect);
  }

  private onSignal = (signal: SignalData) => {
    this.signalData = signal;
    this.signalDeferred.resolve(signal);
    this.emit('signal', signal)
  };

  private onData = (data: Buffer): void => {
    // HACK: Workaround simple-peer bug where data is received before
    // 'connect' event
    if (!this.connected) {
      this.once('connect', () => this.receive(data));
      return;
    }

    this.receive(data);
  };

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
  /** Subscribe to peer connections. */
  on(eventName: 'connection', listener: (peer: RTCPeerConn) => void): this;
}
