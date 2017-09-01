import { IRTCPeerCoordinator } from "lobby/rtc";

export const enum LobbyType {
  Private,
  FriendsOnly,
  Public,
  Invisible
}

export interface ILobbyOptions {
  type?: LobbyType;
  maxMembers?: number;
}

export interface ILobbySession {
  name: string;
  id: string;
}

export abstract class Platform {
  abstract createLobby(opts: ILobbyOptions): Promise<boolean>
  abstract joinLobby(id: string): Promise<boolean>
  abstract leaveLobby(id: string): boolean
  abstract findLobbies(): Promise<ILobbySession[]>

  abstract createPeerCoordinator(): IRTCPeerCoordinator
}
