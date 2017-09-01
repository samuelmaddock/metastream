import { Platform, ILobbyOptions, ILobbySession } from "platform/types";
import { IRTCPeerCoordinator } from "lobby/rtc";

export class ElectronPlatform extends Platform {
  createLobby(opts: ILobbyOptions): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  joinLobby(id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  leaveLobby(id: string): boolean {
    throw new Error("Method not implemented.");
  }
  findLobbies(): Promise<ILobbySession[]> {
    throw new Error("Method not implemented.");
  }
  createPeerCoordinator(): IRTCPeerCoordinator {
    throw new Error("Method not implemented.");
  }

}
