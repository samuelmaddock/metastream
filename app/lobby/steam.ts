import { EventEmitter } from 'events';
import { steamworks } from "steam";
import { NetUniqueId } from "lobby/types";
import { IRTCPeerCoordinator, RTCPeerConn, SignalData } from "lobby/rtc";
import SimplePeer from "simple-peer";


type SteamID64 = Steamworks.SteamID64;
type SteamUniqueId = NetUniqueId<Steamworks.SteamID64>;

interface SteamMatchmakingLobbyOptions {
  // Join options

  /** Lobby Steam ID to join. If left out, a new lobby is created. */
  steamId?: Steamworks.SteamID64;

  // Create options

  lobbyType?: Steamworks.LobbyType;
  maxMembers?: number;
}

export class SteamMatchmakingLobby extends EventEmitter {
  private steamId: SteamID64;

  ownerSteamId: SteamID64;
  isOwner: boolean = false;

  constructor(opts: SteamMatchmakingLobbyOptions = {}) {
    super();

    if (opts.steamId) {
      this.joinLobby(opts);
    } else {
      this.createLobby(opts);
    }

    window.addEventListener('beforeunload', this.close, false);
  }

  private joinLobby(opts: SteamMatchmakingLobbyOptions): void {
    steamworks.joinLobby(opts.steamId!, lobbyId => {
      // BUG: lobbyId = '1'???
      // this.steamId = lobbyId;
      this.steamId = opts.steamId!;
      this.onJoin();
    });
  }

  private createLobby(opts: SteamMatchmakingLobbyOptions): void {
    steamworks.createLobby(
      opts.lobbyType || steamworks.LobbyType.FriendsOnly,
      opts.maxMembers || 8,
      lobbyId => {
        this.steamId = lobbyId;
        this.onJoin();
      }
    )
  }

  private onJoin(): void {
    this.ownerSteamId = steamworks.getLobbyOwner(this.steamId).getRawSteamID();

    const localSteamId = steamworks.getSteamId().getRawSteamID();
    this.isOwner = this.ownerSteamId === localSteamId;

    steamworks.on('lobby-chat-message', this.onMessage);

    console.log('Joined Steam lobby', this.steamId);

    this.emit('connect', this.steamId);
  }

  private onLeave(): void {
    steamworks.removeListener('lobby-chat-message', this.onMessage);
  }

  private onMessage = (lobbyId: Steamworks.SteamID, userId: Steamworks.SteamID, type: any, chatId: number): void => {
    const entry = steamworks.getLobbyChatEntry(lobbyId.getRawSteamID(), chatId);
    console.log('Received Steam lobby message', entry);
    this.emit('message', entry);
  }

  close = (): void => {
    steamworks.leaveLobby(this.steamId);
  }

  getOwner(): SteamID64 {
    return this.ownerSteamId;
  }

  sendChatMessage(message: Buffer) {
    steamworks.sendLobbyChatMsg(this.steamId, message);
  }
}


const iceServers = [
  { url: 'stun:stun3.l.google.com:19302' }
];

const encodeSignal = (signal: Object) => btoa(JSON.stringify(signal));
const decodeSignal = (signal: string) => JSON.parse(atob(signal));

enum MessageType {
  RequestJoin = 1,
  Offer,
  Answer
}

type IMessageFrame =
  { type: MessageType.RequestJoin, data: undefined } |
  { type: MessageType.Offer, data: string, to: string } |
  { type: MessageType.Answer, data: string, to: string };

/**
 * Coordinates RTC peer connections over Steam's Matchmaking lobby chat.
 */
export class SteamRTCPeerCoordinator extends EventEmitter implements IRTCPeerCoordinator {
  private lobby: SteamMatchmakingLobby;
  private owner: boolean;
  private connecting: {[key: string]: RTCPeerConn | undefined} = {};

  get isLobbyOwner() {
    return this.lobby.isOwner;
  }

  get localSteamId() {
    return steamworks.getSteamId().getRawSteamID();
  }

  constructor(lobby: SteamMatchmakingLobby) {
    super();
    this.lobby = lobby;

    this.lobby.on('connect', this.onConnect);
    this.lobby.on('message', this.onReceive);
  }

  signal(signal: string): void {
    throw new Error("Method not implemented.");
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
  }

  private onReceive = (entry: Steamworks.ILobbyChatEntry) => {
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
          const conn = this.createPeer(steamId);
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
  }

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

export const SteamRTCPeerCoordinatorFactory = (steamLobby: SteamMatchmakingLobby) => {
  const peerCoord = new SteamRTCPeerCoordinator(steamLobby);
  return peerCoord;
}
