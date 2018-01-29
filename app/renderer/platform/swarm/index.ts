const { ipcRenderer, remote } = chrome

import { Platform, ILobbyOptions, ILobbySession, ILobbyData } from 'renderer/platform/types'
import { Deferred } from 'utils/async'
import { NetUniqueId } from 'renderer/network'
import { IRTCPeerCoordinator } from 'renderer/network/rtc'

export class SwarmPlatform extends Platform {
  private id: NetUniqueId<number>

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    return false
  }

  async joinLobby(id: string): Promise<boolean> {
    return false
  }

  leaveLobby(id: string): boolean {
    return false
  }

  async findLobbies(): Promise<ILobbySession[]> {
    return []
  }

  getLobbyData(): ILobbyData | null {
    return null
  }

  createPeerCoordinator(): IRTCPeerCoordinator {
    throw new Error('Not yet implemented')
  }

  getUserName(userId: NetUniqueId): string {
    return `Swarm-${userId}`
  }

  getLocalId(): NetUniqueId {
    if (!this.id) {
      // TODO: get from keypair
      this.id = new NetUniqueId(-1)
    }
    return this.id
  }

  async requestUserInfo(id: NetUniqueId | string): Promise<any> {}
  async requestAvatarUrl(id: NetUniqueId | string): Promise<string | void> {}
}
