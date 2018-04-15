import { NetServer, NetUniqueId } from 'renderer/network'

export interface ILobbyOptions {
  p2p?: boolean
  websocket?: boolean
}

export interface ILobbySession {
  name: string
  id: string
}

export abstract class Platform {
  // Matchmaking
  abstract getServer(): NetServer | null
  abstract createLobby(opts: ILobbyOptions): Promise<boolean>
  abstract joinLobby(id: string): Promise<boolean>
  abstract leaveLobby(id: string): boolean
  abstract findLobbies(): Promise<ILobbySession[]>

  // Users
  abstract getLocalId(): NetUniqueId
  abstract getUserName(id: NetUniqueId): string
  abstract requestUserInfo(id: NetUniqueId | string): Promise<any>
  abstract requestAvatarUrl(id: NetUniqueId | string): Promise<string | void>
}
