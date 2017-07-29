import { EventEmitter } from 'events';
import { steamworks } from "steam";
import { NetUniqueId } from "lobby/types";
import { IRTCPeerCoordinator } from "lobby/rtc";


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
  private ownerSteamId: SteamID64;
  private isOwner: boolean;

  constructor(opts: SteamMatchmakingLobbyOptions = {}) {
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

  private onJoin(): void {
    this.ownerSteamId = steamworks.getLobbyOwner(this.steamId).getRawSteamID();
    steamworks.on('lobby-chat-message', this.onMessage);
  }

  private onLeave(): void {
    steamworks.removeListener('lobby-chat-message', this.onMessage);
  }

  private onMessage = (lobbyId: Steamworks.SteamID, userId: Steamworks.SteamID, type: any, chatId: number): void => {
    const entry = steamworks.getLobbyChatEntry(lobbyId.getRawSteamID(), chatId);

    this.emit('message', entry);
  }

  close(): void {}
}


export class SteamRTCPeerCoordinator extends EventEmitter implements IRTCPeerCoordinator {
  private lobby: SteamMatchmakingLobby;

  constructor(lobby: SteamMatchmakingLobby) {
    super();
    this.lobby = lobby;
    this.lobby.on('message');
  }

  signal(signal: string): void {
    throw new Error("Method not implemented.");
  }
}

export const SteamRTCPeerCoordinatorFactory = (steamLobby: SteamMatchmakingLobby) => {
  const peerCoord = new SteamRTCPeerCoordinator(steamLobby);
  return peerCoord;
}
