import { EventEmitter } from 'events';

import { NetUniqueId } from "lobby/types";
import { IRTCPeerCoordinator, RTCPeerConn, SignalData } from "lobby/rtc";
import SimplePeer from "simple-peer";
import { LOBBY_GAME_GUID } from "constants/steamworks";

import { SteamMatchmakingLobby } from "./lobby";
import { SteamRTCPeerCoordinator } from "./peer-coordinator";
import { Platform, ILobbyOptions, ILobbySession } from "platform/types";

import { steamworks } from "steam";
import { getLobbyData } from "utils/steamworks";
import { Deferred } from "utils/async";

export class SteamPlatform extends Platform {
  private lobby: SteamMatchmakingLobby | null;

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    this.lobby = new SteamMatchmakingLobby(opts);
    return true;
  }

  async joinLobby(id: string): Promise<boolean> {
    this.lobby = new SteamMatchmakingLobby({
      steamId: id
    });
    return true;
  }

  leaveLobby(id: string): boolean {
    if (this.lobby) {
      this.lobby.close();
      this.lobby = null;
      return true;
    } else {
      throw new Error("[SteamPlatform] leaveLobby: No active session.");
    }
  }

  findLobbies(): Promise<ILobbySession[]> {
    const deferred = new Deferred<ILobbySession[]>();

    // TODO: allow filter customization
    steamworks.requestLobbyList({
      filters: [
        { key: 'game', value: LOBBY_GAME_GUID, comparator: steamworks.LobbyComparison.Equal }
      ],
      distance: steamworks.LobbyDistanceFilter.Worldwide,
      count: 50
    }, (count) => {
      console.info('Received lobby list', count);

      let lobbies: ILobbySession[] = [];

      for (let i = 0; i < count; i++) {
        const lobbyId = steamworks.getLobbyByIndex(i);

        const lobby = {
          name: 'Steam Lobby Foo',
          id: lobbyId.getRawSteamID(),
          data: getLobbyData(steamworks, lobbyId)
        };

        lobbies.push(lobby);
      }

      deferred.resolve(lobbies);
    });
    // TODO: failure case

    return deferred.promise;
  }

  createPeerCoordinator(): IRTCPeerCoordinator {
    if (this.lobby) {
      const peerCoord = new SteamRTCPeerCoordinator(this.lobby);
      return peerCoord;
    } else {
      throw new Error("[SteamPlatform] createPeerCoordinator: No active session.");
    }
  }
}
