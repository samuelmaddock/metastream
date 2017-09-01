import { EventEmitter } from 'events';
import { steamworks } from "steam";
import { NetUniqueId } from "lobby/types";

import { LOBBY_GAME_GUID } from "constants/steamworks";

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
      opts.lobbyType || steamworks.LobbyType.Public,
      opts.maxMembers || 8,
      lobbyId => {
        this.steamId = lobbyId;
        steamworks.setLobbyData(lobbyId, 'game', LOBBY_GAME_GUID);
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
