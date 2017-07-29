import SimplePeer from "simple-peer";
import { EventEmitter } from 'events';
import { steamworks } from "steam";
import { NetUniqueId, NetConnection, NetServer } from "lobby/types";


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
  private conn: SimplePeer.Instance;

  constructor(id: NetUniqueId, conn: SimplePeer.Instance) {
    super(id);
    this.conn = conn;
    this.setup();
  }

  private setup(): void {
    this.conn.on('close', this.close);
    this.conn.on('data', this.receive);
  }

  protected onClose(): void {
    this.conn.removeAllListeners();
    this.conn.destroy();
    super.onClose();
  }

  send(data: Buffer): void {
    this.conn.send(data);
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
