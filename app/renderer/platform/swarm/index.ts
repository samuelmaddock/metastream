const { ipcRenderer, remote } = chrome

import { Platform, ILobbyOptions, ILobbySession } from 'renderer/platform/types'
import { Deferred } from 'utils/async'
import { NetServer, NetUniqueId } from 'renderer/network'
import { SwarmRTCPeerCoordinator } from 'renderer/platform/swarm/rtc-coordinator'
import { isP2PHash, isIP, isUrlDomain } from 'utils/network'
import { PeerCoordinator } from '../../network/server'
import { WebSocketClientCoordinator } from './ws-client-coordinator'
import { WebSocketServerCoordinator } from './ws-server-coordinator'

type SwarmId = string

const getIpcId = (function() {
  let ipcId = 0
  return () => ++ipcId
})()

const MAX_NAME_LEN = 32

export class SwarmPlatform extends Platform {
  private id: NetUniqueId<SwarmId>
  private username: string

  private server: NetServer | null = null

  constructor() {
    super()

    const swarmInfo = ipcRenderer.sendSync('platform-swarm-init')
    this.id = new NetUniqueId<SwarmId>(swarmInfo.id)
    this.username = swarmInfo.username
  }

  getServer() {
    return this.server
  }

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    const isHost = true
    const coordinators: PeerCoordinator[] = []

    if (opts.p2p) {
      coordinators.push(new SwarmRTCPeerCoordinator(isHost))
    }
    if (opts.websocket) {
      coordinators.push(new WebSocketServerCoordinator())
    }

    this.server = new NetServer({ isHost, coordinators })

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

    return success
  }

  private async joinP2PLobby(hash: string): Promise<boolean> {
    this.server = new NetServer({
      isHost: false,
      coordinators: [new SwarmRTCPeerCoordinator(false)]
    })

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
    const coord = new WebSocketClientCoordinator()

    const server = new NetServer({
      isHost: false,
      coordinators: [coord]
    })

    try {
      // TODO: handle cancel connection
      await coord.connect(ip)
    } catch (e) {
      server.close()
      return false
    }

    this.server = server
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

    return success
  }

  leaveLobby(id: string): boolean {
    if (this.server) {
      this.server.close()
      this.server = null
    }

    ipcRenderer.send('platform-leave-lobby')

    return true
  }

  async findLobbies(): Promise<ILobbySession[]> {
    return []
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
