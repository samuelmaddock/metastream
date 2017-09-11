import { IRTCPeerCoordinator } from 'lobby/rtc';

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
  // Matchmaking
  abstract createLobby(opts: ILobbyOptions): Promise<boolean>;
  abstract joinLobby(id: string): Promise<boolean>;
  abstract leaveLobby(id: string): boolean;
  abstract findLobbies(): Promise<ILobbySession[]>;

  // RTC
  abstract createPeerCoordinator(): IRTCPeerCoordinator;

  // Users
  abstract getUserName(platformId: string): string;
}
