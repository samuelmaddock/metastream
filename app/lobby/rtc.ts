import SimplePeer from "simple-peer";
import { EventEmitter } from 'events';
import { steamworks } from "steam";
import { NetUniqueId } from "lobby";


/** WebRTC server. */
export class RTCServer {
  // Dependencies
  private peerCoord: IRTCPeerCoordinator;

  private peers: RTCPeerConn[] = [];

  constructor(peerCoord: IRTCPeerCoordinator) {
    this.peerCoord = peerCoord;

    this.peerCoord.on('connection', this.onConnection);
  }

  private onConnection = (peer: RTCPeerConn): void => {
    console.log('new peer', peer);

    this.peers.push(peer);
  }

  private close(): void {
    this.peerCoord.removeListener('connection', this.onConnection);

    this.peers.forEach(peer => {
      peer.close();
    });

    this.peers = [];
  }
}


/** WebRTC peer connection. */
export class RTCPeerConn {
  id: NetUniqueId;

  private conn: SimplePeer.Instance;

  constructor(conn: SimplePeer.Instance) {
    this.conn = conn;
  }

  close(): void {
    this.conn.destroy();
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
