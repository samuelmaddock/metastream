import SimplePeer, { SimplePeerData } from 'simple-peer'
import createClient, { SignalClient } from 'metastream-signal-server/client'

import shortid from 'shortid'
import sodium from 'libsodium-wrappers'

import { NetUniqueId, localUserId, localUser } from 'network'
import { PeerCoordinator } from 'network/server'
import { RTCPeerConn } from 'network/rtc'

const iceServers = [
  { url: 'stun:stun1.l.google.com:19302' },
  { url: 'stun:stun2.l.google.com:19302' },
  { url: 'stun:stun3.l.google.com:19302' },
  { url: 'stun:stun4.l.google.com:19302' }
]

interface Options {
  host: boolean
  hostId?: string
}

export class WebRTCPeerCoordinator extends PeerCoordinator {
  private connecting = new Map<string, RTCPeerConn>()
  private sessionClient?: SignalClient

  constructor(opts: Options) {
    super()

    this.host = opts.host

    this.authenticatePeer = this.authenticatePeer.bind(this)

    if (this.host) {
      this.createSession()
    } else if (opts.hostId) {
      this.joinSession(opts.hostId)
    } else {
      throw new Error('Failed to initialize WebRTCPeerCoordinator')
    }
  }

  private getClient() {
    return createClient({
      // TODO: get from env vars
      server: 'ws://127.0.0.1:27064',
      peerOpts: {
        config: { iceServers }
      }
    })
  }

  private async createSession() {
    let client

    try {
      client = await this.getClient()
    } catch {
      // TODO: bubble error
      return
    }

    try {
      await client.createRoom({
        publicKey: localUser().id.publicKey,
        privateKey: localUser().id.privateKey!
      })
    } catch {
      // TODO: bubble error
      return
    }

    client.on('peer', this.authenticatePeer)
    this.sessionClient = client

    console.debug('Created signal client session')
  }

  private async joinSession(hostId: string) {
    let client
    try {
      client = await this.getClient()
    } catch {
      // TODO: bubble error
      return
    }

    let peer
    try {
      peer = await client.joinRoom(hostId)
    } catch {
      // TODO: bubble error
      return
    }

    console.debug('Joined signal client session', peer)
    await this.authenticatePeer(peer)
  }

  close() {
    if (this.sessionClient) {
      this.sessionClient.removeListener('peer', this.authenticatePeer)
      this.sessionClient.close()
      this.sessionClient = undefined
    }

    this.connecting.forEach(conn => conn.close())
    this.connecting.clear()
  }

  private async authenticatePeer(peer: SimplePeer.Instance) {
    // TODO: authenticate and use user's real identity
    const userId = 'deadbeafdeadbeafdeadbeafdeadbeaf'
    const publicKey = sodium.from_hex(userId)

    const netId = new NetUniqueId(publicKey)
    const conn = new RTCPeerConn(netId, peer)

    console.log(`Authenticated peer ${userId}`, conn)
    this.emit('connection', conn)

    // this.connecting.set(userId, conn)
    // conn.once('connect', () => {
    //   conn.removeAllListeners()
    //   this.connecting.delete(userId)
    //   this.emit('connection', conn)
    // })
    // conn.once('close', () => {
    //   this.connecting.delete(userId)
    // })
  }
}
