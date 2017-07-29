/** Wrapper around social user IDs. */
import { SteamMatchmakingLobby } from "lobby/steam";
import { RTCServer } from "lobby/rtc";

/** Wrapper around social user IDs. */
export class NetUniqueId<T = any> {
  private id: T;

  constructor(id: T) {
    this.id = id;
  }

  toString(): string {
    return this.id + '';
  }
}

export function initRTCServer() {
  const steamLobby = new SteamMatchmakingLobby();
  const peerCoord = SteamRTCPeerCoordinatorFactory(steamLobby);

  const rtcServer = new RTCServer(peerCoord);

}
