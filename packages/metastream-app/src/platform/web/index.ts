import sodium from 'libsodium-wrappers'
import createClient from '@metastream/signal-server/lib/client'
import { waitEvent } from '@metastream/signal-server/lib/util'

import { NetServer, NetUniqueId } from 'network'
import { ILobbyOptions } from 'platform/types'
import { isP2PHash, isIP, isUrlDomain } from 'utils/network'
import { PeerCoordinator } from 'network/server'
import { initIdentity } from './identity'
import { WebRTCPeerCoordinator } from './rtc-coordinator'
import { NETWORK_TIMEOUT } from 'constants/network'
import { NetworkError, NetworkErrorCode } from '../../network/error'

type HexId = string

export class WebPlatform {
  ready: Promise<void>

  private id!: NetUniqueId
  private server?: NetServer

  constructor() {
    this.ready = initIdentity().then(keyPair => {
      this.id = new NetUniqueId(keyPair.publicKey, keyPair.privateKey)
    })
  }

  getServer() {
    return this.server
  }

  async createLobby(opts: ILobbyOptions): Promise<void> {
    const coordinators: PeerCoordinator[] = []

    if (opts.p2p) {
      coordinators.push(new WebRTCPeerCoordinator({ host: true }))
    }

    this.server = new NetServer({ isHost: true, coordinators })
  }

  private async joinP2PLobby(hash: string): Promise<void> {
    ga('event', { ec: 'session', ea: 'connect', el: 'p2p' })

    const coordinator = new WebRTCPeerCoordinator({ host: false, hostId: hash })

    this.server = new NetServer({
      isHost: false,
      coordinators: [coordinator]
    })

    const promises = [
      waitEvent(this.server, 'connect', NETWORK_TIMEOUT),
      waitEvent(this.server, 'error', NETWORK_TIMEOUT)
    ]

    try {
      const [result] = await Promise.race(promises)
      if (result instanceof Error) throw result
    } catch (e) {
      promises.forEach(p => p.cancel())
      if (this.server) {
        this.server.close()
        this.server = undefined
      }
      throw e
    }
  }

  async joinLobby(lobbyId: string): Promise<void> {
    if (isP2PHash(lobbyId)) {
      await this.joinP2PLobby(lobbyId)
    } else {
      throw new NetworkError(NetworkErrorCode.UnknownSession)
    }
  }

  leaveLobby(id: string): boolean {
    if (this.server) {
      this.server.close()
      this.server = undefined
    }

    return true
  }

  getLocalId(): NetUniqueId {
    return this.id
  }
}
