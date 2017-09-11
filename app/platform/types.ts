import { IRTCPeerCoordinator } from 'lobby/rtc';
import { NetUniqueId } from 'lobby/types';

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
  abstract getLocalId(): NetUniqueId;
  abstract getUserName(id: NetUniqueId): string;
}
