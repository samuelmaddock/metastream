const { ipcRenderer, remote } = chrome

import { Platform, ILobbyOptions, ILobbySession, ILobbyData } from 'renderer/platform/types'
import { Deferred } from 'utils/async'
import { NetUniqueId } from 'renderer/network'
import { IRTCPeerCoordinator } from 'renderer/network/rtc'
import { SwarmRTCPeerCoordinator } from 'renderer/platform/swarm/peer-coordinator'
import { connectToWebSocketServer } from './websocket'
import { isP2PHash, isIP, isUrlDomain } from '../../../utils/network'

type SwarmId = string

const getIpcId = (function() {
  let ipcId = 0
  return () => ++ipcId
})()

const MAX_NAME_LEN = 32

export class SwarmPlatform extends Platform {
  private id: NetUniqueId<SwarmId>
  private username: string
  private connected: boolean = false
  private isHosting: boolean = false
  private webSocket: any = null

  constructor() {
    super()

    const swarmInfo = ipcRenderer.sendSync('platform-swarm-init')
    this.id = new NetUniqueId<SwarmId>(swarmInfo.id)
    this.username = swarmInfo.username
  }

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    // Send IPC to main with lobby options

    // idea: middleware for lobby: max members, password, auth, etc
    // do auth first so encrypted socket can be used for the rest

    const ipcId = getIpcId()
    ipcRenderer.send('platform-create-lobby', ipcId, opts)

    const success = await new Promise<boolean>((resolve, reject) => {
      ipcRenderer.once(
        'platform-create-lobby-result',
        (event: Electron.Event, id: number, result: boolean) => {
          if (id === ipcId) {
            resolve(result)
          }
        }
      )
    })

    this.isHosting = true
    this.connected = success
    return success
  }

  private async joinP2PLobby(hash: string): Promise<boolean> {
    const ipcId = getIpcId()
    ipcRenderer.send('platform-join-lobby', ipcId, hash)

    const success = await new Promise<boolean>((resolve, reject) => {
      ipcRenderer.once(
        'platform-join-lobby-result',
        (event: Electron.Event, id: number, result: boolean) => {
          if (id === ipcId) {
            resolve(result)
          }
        }
      )
    })

    return success
  }

  async joinWebSocketLobby(ip: string): Promise<boolean> {
    try {
      // TODO: handle cancel connection
      this.webSocket = await connectToWebSocketServer(ip)
    } catch (e) {
      return false
    }
    return true
  }

  async joinLobby(lobbyId: string): Promise<boolean> {
    let success

    if (isP2PHash(lobbyId)) {
      success = await this.joinP2PLobby(lobbyId)
    } else if (isIP(lobbyId) || isUrlDomain(lobbyId)) {
      success = await this.joinWebSocketLobby(lobbyId)
    } else {
      success = false
    }

    this.isHosting = false
    this.connected = success
    return success
  }

  leaveLobby(id: string): boolean {
    if (this.webSocket) {
      this.webSocket.close()
      this.webSocket = null
    }

    // TODO: close all webrtc peers
    ipcRenderer.send('platform-leave-lobby')
    this.connected = false
    this.isHosting = false

    return true
  }

  async findLobbies(): Promise<ILobbySession[]> {
    return []
  }

  getLobbyData(): ILobbyData | null {
    return null
  }

  createPeerCoordinator(): IRTCPeerCoordinator {
    if (!this.connected) {
      throw new Error('[Swarm Platform] createPeerCoordinator: No active session.')
    }

    return new SwarmRTCPeerCoordinator(this.isHosting)
  }

  getUserName(userId: NetUniqueId): string {
    let name = (this.getLocalId().equals(userId) && this.username) || `Swarm-${userId}`

    if (name.length > MAX_NAME_LEN) {
      name = name.substr(0, MAX_NAME_LEN)
    }

    return name
  }

  getLocalId(): NetUniqueId {
    return this.id
  }

  async requestUserInfo(id: NetUniqueId | string): Promise<any> {}
  async requestAvatarUrl(id: NetUniqueId | string): Promise<string | void> {}
}
