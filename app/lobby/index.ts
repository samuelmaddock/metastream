/** Wrapper around social user IDs. */
import { SteamMatchmakingLobby, SteamRTCPeerCoordinatorFactory } from "lobby/steam";
import { RTCServer } from "lobby/rtc";

export function initSteamRTCServer() {
  const steamLobby = new SteamMatchmakingLobby();
  const peerCoord = SteamRTCPeerCoordinatorFactory(steamLobby);

  const rtcServer = new RTCServer(peerCoord);

}
