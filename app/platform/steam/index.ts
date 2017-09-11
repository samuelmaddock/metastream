import { EventEmitter } from 'events';

import { NetUniqueId } from 'lobby/types';
import { IRTCPeerCoordinator, RTCPeerConn, SignalData } from 'lobby/rtc';
import SimplePeer from 'simple-peer';
import { LOBBY_GAME_GUID } from 'constants/steamworks';

import { SteamMatchmakingLobby } from './lobby';
import { SteamRTCPeerCoordinator } from './peer-coordinator';
import { Platform, ILobbyOptions, ILobbySession } from 'platform/types';

import { steamworks } from 'steam';
import { getLobbyData } from 'utils/steamworks';
import { Deferred } from 'utils/async';

export class SteamPlatform extends Platform {
  private lobby: SteamMatchmakingLobby | null;

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    this.lobby = await SteamMatchmakingLobby.createLobby(opts);
    return true;
  }

  async joinLobby(steamId: string): Promise<boolean> {
    this.lobby = await SteamMatchmakingLobby.joinLobby({ steamId });
    return true;
  }

  leaveLobby(id: string): boolean {
    if (this.lobby) {
      this.lobby.close();
      this.lobby = null;
      return true;
    } else {
      throw new Error('[SteamPlatform] leaveLobby: No active session.');
    }
  }

  findLobbies(): Promise<ILobbySession[]> {
    const deferred = new Deferred<ILobbySession[]>();

    // TODO: allow filter customization
    steamworks.requestLobbyList(
      {
        filters: [
          { key: 'game', value: LOBBY_GAME_GUID, comparator: steamworks.LobbyComparison.Equal }
        ],
        distance: steamworks.LobbyDistanceFilter.Worldwide,
        count: 50
      },
      count => {
        console.info('Received lobby list', count);

        let lobbies: ILobbySession[] = [];

        for (let i = 0; i < count; i++) {
          const lobbyId = steamworks.getLobbyByIndex(i);
          const data = getLobbyData(steamworks, lobbyId);

          const lobby = {
            name: data.name,
            id: lobbyId.getRawSteamID(),
            data
          };

          lobbies.push(lobby);
        }

        deferred.resolve(lobbies);
      }
    );
    // TODO: failure case

    return deferred.promise;
  }

  createPeerCoordinator(): IRTCPeerCoordinator {
    if (this.lobby) {
      const peerCoord = new SteamRTCPeerCoordinator(this.lobby);
      return peerCoord;
    } else {
      throw new Error('[SteamPlatform] createPeerCoordinator: No active session.');
    }
  }

  getUserName(platformId: string): string {
    // TODO: hold copy of SteamID in UniqueNetId, pass that into this function
    return platformId;
  }
}
