import SimplePeer from 'simple-peer';
import { EventEmitter } from 'events';
import { steamworks } from 'steam';

import { NetUniqueId } from 'lobby/types';
import { IRTCPeerCoordinator, RTCPeerConn, SignalData } from 'lobby/rtc';

import { SteamMatchmakingLobby, ISteamLobbyChatEnvelope } from './lobby';

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
  | { type: MessageType.Offer; data: string; to: string }
  | { type: MessageType.Answer; data: string; to: string };

/**
 * Coordinates RTC peer connections over Steam's Matchmaking lobby chat.
 */
export class SteamRTCPeerCoordinator extends EventEmitter implements IRTCPeerCoordinator {
  private lobby: SteamMatchmakingLobby;
  private connecting: { [key: string]: RTCPeerConn | undefined } = {};

  get isLobbyOwner() {
    return this.lobby.isOwner;
  }

  get localSteamId() {
    return steamworks.getSteamId().getRawSteamID();
  }

  constructor(lobby: SteamMatchmakingLobby) {
    super();
    this.lobby = lobby;
    this.lobby.on('message', this.onReceive);
    this.onConnect();
  }

  signal(signal: string): void {
    throw new Error('Method not implemented.');
  }

  private createPeer(steamId: Steamworks.SteamID): RTCPeerConn {
    const peer = new SimplePeer({
      initiator: this.isLobbyOwner,
      trickle: false,
      config: {
        iceServers
      }
    });

    const netId = new NetUniqueId(steamId);
    const userId = steamId.getRawSteamID();

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

  private onReceive = ({ entry, userId }: ISteamLobbyChatEnvelope) => {
    const { message, steamId } = entry;

    // Ignore messages from self
    if (steamId === this.localSteamId) {
      return;
    }

    let msg;

    try {
      msg = JSON.parse(message.toString('utf-8')) as IMessageFrame;
    } catch (e) {
      console.error('Failed to read lobby message', message);
      return;
    }

    // TODO: need to validate this by checking steam lobby owner
    switch (msg.type) {
      case MessageType.RequestJoin:
        if (this.isLobbyOwner) {
          const conn = this.createPeer(userId);
          conn.getSignal().then(signal => {
            this.sendOffer(signal, steamId);
          });
        }
        return;
      case MessageType.Offer:
        if (!this.isLobbyOwner && (msg as any).to === this.localSteamId) {
          const signal = decodeSignal(msg.data!);
          const conn = this.createPeer(this.lobby.ownerSteamId);
          conn.signal(signal);

          conn.getSignal().then(answer => {
            this.sendAnswer(answer);
          });
        }
        break;
      case MessageType.Answer:
        if (this.isLobbyOwner) {
          const signal = decodeSignal(msg.data!);
          const conn = this.connecting[steamId];
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
    this.lobby.sendChatMessage(buf);
  }

  private sendOffer(signal: SignalData, userId: string): void {
    const msg = {
      type: MessageType.Offer,
      data: encodeSignal(signal),
      to: userId
    } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobby.sendChatMessage(buf);
  }

  private sendAnswer(signal: Object): void {
    const msg = {
      type: MessageType.Answer,
      data: encodeSignal(signal)
    } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobby.sendChatMessage(buf);
  }
}
