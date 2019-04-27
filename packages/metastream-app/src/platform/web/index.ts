import sodium from 'libsodium-wrappers'
import createClient from '@metastream/signal-server/client'
import { waitEvent } from '@metastream/signal-server/util'

import { NetServer, NetUniqueId } from 'network'
import { ILobbyOptions } from 'platform/types'
import { isP2PHash, isIP, isUrlDomain } from 'utils/network'
import { PeerCoordinator } from 'network/server'
import { initIdentity } from './identity'
import { WebRTCPeerCoordinator } from './rtc-coordinator'

type HexId = string

export class WebPlatform {
  ready: Promise<void>

  private id!: NetUniqueId
  private server: NetServer | null = null

  constructor() {
    this.ready = initIdentity().then(keyPair => {
      this.id = new NetUniqueId(keyPair.publicKey, keyPair.privateKey)
    })
  }

  getServer() {
    return this.server
  }

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    const coordinators: PeerCoordinator[] = []

    if (opts.p2p) {
      coordinators.push(new WebRTCPeerCoordinator({ host: true }))
    }

    this.server = new NetServer({ isHost: true, coordinators })

    return true
  }

  private async joinP2PLobby(hash: string): Promise<boolean> {
    ga('event', { ec: 'session', ea: 'connect', el: 'p2p' })

    const coordinator = new WebRTCPeerCoordinator({ host: false, hostId: hash })

    this.server = new NetServer({
      isHost: false,
      coordinators: [coordinator]
    })

    try {
      await waitEvent(coordinator, 'connection')
    } catch {
      return false
    }

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

  getLocalId(): NetUniqueId {
    return this.id
  }
}
