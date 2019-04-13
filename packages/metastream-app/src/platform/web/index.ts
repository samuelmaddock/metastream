import { Platform, ILobbyOptions, ILobbySession } from 'platform/types'
import { NetServer, NetUniqueId } from 'network'
import { isP2PHash, isIP, isUrlDomain } from 'utils/network'
import { PeerCoordinator } from 'network/server'

type SwarmId = string

const MAX_NAME_LEN = 32

export class WebPlatform extends Platform {
  private id: NetUniqueId<SwarmId>
  private username: string

  private server: NetServer | null = null

  constructor() {
    super()

    this.id = new NetUniqueId<SwarmId>('1234')
    this.username = 'Foobar'
  }

  getServer() {
    return this.server
  }

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    const isHost = true
    const coordinators: PeerCoordinator[] = []

    // if (opts.p2p) {
    //   coordinators.push(new SwarmRTCPeerCoordinator(isHost))
    // }

    this.server = new NetServer({ isHost, coordinators })

    return true
  }

  private async joinP2PLobby(hash: string): Promise<boolean> {
    ga('event', { ec: 'session', ea: 'connect', el: 'p2p' })

    this.server = new NetServer({
      isHost: false,
      coordinators: []
    })

    return true
  }

  async joinLobby(lobbyId: string): Promise<boolean> {
    let success

    if (isP2PHash(lobbyId)) {
      success = await this.joinP2PLobby(lobbyId)
      // } else if (isIP(lobbyId) || isUrlDomain(lobbyId)) {
      //   success = await this.joinWebSocketLobby(lobbyId)
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

    return true
  }

  async findLobbies(): Promise<ILobbySession[]> {
    return []
  }

  getUserName(userId: NetUniqueId): string {
    let name = (this.getLocalId().equals(userId) && this.username) || `Web-${userId}`

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
