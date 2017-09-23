import { EventEmitter } from 'events';

import SimplePeer from 'simple-peer';
import { LOBBY_GAME_GUID } from 'constants/steamworks';

import { SteamMatchmakingLobby } from './lobby';
import { SteamRTCPeerCoordinator } from './peer-coordinator';
import { Platform, ILobbyOptions, ILobbySession, SessionKey, ILobbyData } from 'platform/types';

import { steamworks } from 'steam';
import { getLobbyData } from 'utils/steamworks';
import { Deferred } from 'utils/async';
import { SteamUniqueId } from 'platform/steam/steamid';
import { NetUniqueId } from 'network';
import { IRTCPeerCoordinator } from 'network/rtc';
import { rgba2url } from 'utils/image';

export class SteamPlatform extends Platform {
  private id: NetUniqueId<Steamworks.SteamID>;
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
          {
            key: SessionKey.Guid,
            value: LOBBY_GAME_GUID,
            comparator: steamworks.LobbyComparison.Equal
          }
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

  getLobbyData(): ILobbyData | null {
    if (!this.lobby) {
      return null;
    }

    const data: { [key: string]: string } = {};

    const lobbyId = this.lobby.steamId;
    const len = steamworks.getLobbyDataCount(lobbyId);

    for (let i = 0; i < len; i++) {
      const kv = steamworks.getLobbyDataByIndex(lobbyId, i);
      data[kv[0]] = kv[1];
    }

    return data;
  }

  createPeerCoordinator(): IRTCPeerCoordinator {
    if (this.lobby) {
      const peerCoord = new SteamRTCPeerCoordinator(this.lobby);
      return peerCoord;
    } else {
      throw new Error('[SteamPlatform] createPeerCoordinator: No active session.');
    }
  }

  getUserName(userId: NetUniqueId): string {
    if (!(userId instanceof SteamUniqueId)) {
      throw new Error(
        '[SteamPlatform.getUserName] Received NetUniqueId not an instance of SteamUniqueId'
      );
    }
    const steamId = (userId as SteamUniqueId).id;
    return steamId.getPersonaName();
  }

  getLocalId(): NetUniqueId {
    if (!this.id) {
      const steamId = steamworks.getSteamId();
      this.id = new SteamUniqueId(steamId);
    }
    return this.id;
  }

  requestUserInfo(id: NetUniqueId | string): Promise<SteamUniqueId> {
    const deferred = new Deferred<SteamUniqueId>();

    function cb(steamId: Steamworks.SteamID, flags: typeof Steamworks.PersonaChange) {
      const uid = new SteamUniqueId(steamId);
      deferred.resolve(uid);
      steamworks.removeListener('persona-state-change', cb);
    }
    steamworks.on('persona-state-change', cb);

    const userId = typeof id === 'string' ? id : id.toString();
    steamworks.requestUserInformation(userId, false);

    return deferred.promise;
  }

  async requestAvatarUrl(id: NetUniqueId | string): Promise<string | void> {
    const userId = await this.requestUserInfo(id);

    const handle = steamworks.getMediumFriendAvatar(userId.toString());
    if (handle <= 0) {
      return;
    }

    const rgba = steamworks.getImageRGBA(handle);
    const size = steamworks.getImageSize(handle);

    return await rgba2url(rgba, size.width, size.height);
  }
}
