import SimplePeer from 'simple-peer';
const { remote } = chrome;
import { EventEmitter } from 'events';

import { NetUniqueId } from 'renderer/network';
import { RTCPeerConn, IRTCPeerCoordinator, SignalData } from 'renderer/network/rtc';

import { ElectronLobby, IElectronLobbyMessage } from 'renderer/platform/electron/lobby';

const iceServers = [{ url: 'stun:stun3.l.google.com:19302' }];

const encodeSignal = (signal: Object) => btoa(JSON.stringify(signal));
const decodeSignal = (signal: string) => JSON.parse(atob(signal));

enum MessageType {
  RequestJoin = 1,
  Offer,
  Answer
}

type IMessageFrame =
  | { type: MessageType.RequestJoin; data: undefined }
  | { type: MessageType.Offer; data: string }
  | { type: MessageType.Answer; data: string };

export class ElectronRTCPeerCoordinator extends EventEmitter implements IRTCPeerCoordinator {
  private lobby: ElectronLobby;
  private connecting: { [key: string]: RTCPeerConn | undefined } = {};

  get isLobbyOwner() {
    return this.lobby.isOwner;
  }

  get localId(): string {
    const contents = remote.getCurrentWindow();
    if (contents) {
      return contents.id + '';
    }
    throw new Error('Unable to read focused web contents ID');
  }

  constructor(lobby: ElectronLobby) {
    super();
    this.lobby = lobby;
    this.lobby.on('message', this.onReceive);
    this.onConnect();
  }

  private createPeer(userId: string): RTCPeerConn {
    const peer = new SimplePeer({
      initiator: this.isLobbyOwner,
      trickle: false,
      config: {
        iceServers
      }
    });

    const netId = new NetUniqueId(userId);
    const conn = new RTCPeerConn(netId, peer);
    this.connecting[userId] = conn;

    conn.once('connect', () => {
      conn.removeAllListeners();
      this.connecting[userId] = undefined;
      this.emit('connection', conn);
    });

    conn.once('close', () => {
      this.connecting[userId] = undefined;
    });

    return conn;
  }

  private onConnect = () => {
    if (!this.isLobbyOwner) {
      this.sendJoinRequest();
    }
  };

  private onReceive = (entry: IElectronLobbyMessage) => {
    const { message, senderId } = entry;

    // Ignore messages from self
    if (senderId === this.localId) {
      return;
    }

    let msg;

    try {
      msg = JSON.parse(message.toString('utf-8')) as IMessageFrame;
    } catch (e) {
      console.error('Failed to read lobby message', message);
      return;
    }

    // TODO: need to validate this by checking lobby owner
    switch (msg.type) {
      case MessageType.RequestJoin:
        if (this.isLobbyOwner) {
          const conn = this.createPeer(senderId);
          conn.getSignal().then(signal => {
            this.sendOffer(signal, senderId);
          });
        }
        return;
      case MessageType.Offer:
        if (!this.isLobbyOwner) {
          const signal = decodeSignal(msg.data!);
          const conn = this.createPeer(this.lobby.ownerId);
          conn.signal(signal);

          conn.getSignal().then(answer => {
            this.sendAnswer(answer);
          });
        }
        break;
      case MessageType.Answer:
        if (this.isLobbyOwner) {
          const signal = decodeSignal(msg.data!);
          const conn = this.connecting[senderId];
          if (conn) {
            conn.signal(signal);
          }
        }
        break;
    }
  };

  private sendJoinRequest(): void {
    const msg = { type: MessageType.RequestJoin } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobby.sendChatMessage(this.lobby.ownerId, buf);
  }

  private sendOffer(signal: SignalData, userId: string): void {
    const msg = {
      type: MessageType.Offer,
      data: encodeSignal(signal)
    } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobby.sendChatMessage(userId, buf);
  }

  private sendAnswer(signal: Object): void {
    const msg = {
      type: MessageType.Answer,
      data: encodeSignal(signal)
    } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobby.sendChatMessage(this.lobby.ownerId, buf);
  }
}
