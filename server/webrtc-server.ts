import SimplePeer from "simple-peer";
import { EventEmitter } from 'events';
import { steamworks } from "steam";

/** Wrapper around social user IDs. */
class NetUniqueId<T = any> {
  private id: T;

  constructor(id: T) {
    this.id = id;
  }

  toString(): string {
    return this.id + '';
  }
}

/** WebRTC server. */
class RTCServer {
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
class RTCPeerConn {
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
interface IRTCPeerCoordinator extends EventEmitter {
  /** Send offer/answer signaling data. */
  signal(signal: string): void;

  /** Subscribe to peer connections. */
  on(eventName: 'connection', listener: (peer: RTCPeerConn) => void): this;
}

class SteamRTCPeerCoordinator extends EventEmitter implements IRTCPeerCoordinator {
  signal(signal: string): void {
    throw new Error("Method not implemented.");
  }
}



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

class SteamMatchmakingLobby extends EventEmitter {
  private steamId: SteamID64;
  private ownerSteamId: SteamID64;
  private isOwner: boolean;

  constructor(opts: SteamMatchmakingLobbyOptions) {
    super();

    if (opts.steamId) {
      this.joinLobby(opts);
    } else {
      this.createLobby(opts);
    }
  }

  private joinLobby(opts: SteamMatchmakingLobbyOptions): void {
    steamworks.joinLobby(opts.steamId!, lobbyId => {
      this.steamId = lobbyId;
      this.onJoin();
    });
  }

  private createLobby(opts: SteamMatchmakingLobbyOptions): void {
    steamworks.createLobby(
      opts.lobbyType || Steamworks.LobbyType.FriendsOnly,
      opts.maxMembers || 8,
      lobbyId => {
        this.steamId = lobbyId;
        this.onJoin();
      }
    )
  }

  onJoin(): void {
    this.ownerSteamId = steamworks.getLobbyOwner(this.steamId).getRawSteamID();
    steamworks.on('lobby-chat-message', this.onMessage);
  }

  onLeave(): void {
    steamworks.removeListener('lobby-chat-message', this.onMessage);
  }

  onMessage = (lobbyId: Steamworks.SteamID, userId: Steamworks.SteamID, type: any, chatId: number): void => {
    const entry = steamworks.getLobbyChatEntry(lobbyId.getRawSteamID(), chatId);

    this.emit('message', entry);
  }

  close(): void {}
}
