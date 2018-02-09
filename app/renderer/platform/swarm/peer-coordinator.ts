import SimplePeer from 'simple-peer';
const { remote } = chrome;
import { EventEmitter } from 'events';

import { NetUniqueId } from 'renderer/network';
import { RTCPeerConn, IRTCPeerCoordinator, SignalData } from 'renderer/network/rtc';

import { ElectronLobby, IElectronLobbyMessage } from 'renderer/platform/electron/lobby';

const iceServers = [{ url: 'stun:stun3.l.google.com:19302' }];

export class SwarmRTCPeerCoordinator extends EventEmitter implements IRTCPeerCoordinator {
  signal(signal: string): void {
    throw new Error('Method not implemented.');
  }

  constructor(
    private host: boolean
  ) {
    super()
  }

  private createPeer(userId: string): RTCPeerConn {
    const peer = new SimplePeer({
      initiator: this.host,
      trickle: false,
      config: {
        iceServers
      }
    });

    const netId = new NetUniqueId(userId);
    const conn = new RTCPeerConn(netId, peer);
    /*
    this.connecting[userId] = conn;

    conn.once('connect', () => {
      conn.removeAllListeners();
      this.connecting[userId] = undefined;
      this.emit('connection', conn);
    });

    conn.once('close', () => {
      this.connecting[userId] = undefined;
    });
    */

    return conn;
  }
}
