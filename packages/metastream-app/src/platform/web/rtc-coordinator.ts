import SimplePeer, { SimplePeerData } from 'simple-peer'
import createClient, { SignalClient } from '@metastream/signal-server/lib/client'

import shortid from 'shortid'
import sodium from 'libsodium-wrappers'

import { NetUniqueId, localUserId, localUser } from 'network'
import { PeerCoordinator } from 'network/server'
import { RTCPeerConn } from 'network/rtc'
import { mutualHandshake } from './authenticate'
import { METASTREAM_SIGNAL_SERVER, METASTREAM_ICE_SERVERS } from '../../constants/network'

/** Interval to ping WebSocket to keep connection open. */
const KEEP_ALIVE_INTERVAL = 9 * 60 * 1000

interface Options {
  host: boolean
  hostId?: string
}

export class WebRTCPeerCoordinator extends PeerCoordinator {
  private connecting = new Map<string, RTCPeerConn>()
  private sessionClient?: SignalClient
  private intervalId?: number

  constructor(opts: Options) {
    super()
    this.host = opts.host
    this.authenticatePeer = this.authenticatePeer.bind(this)
    this.keepAlive = this.keepAlive.bind(this)

    if (this.host) {
      this.createSession()
    } else if (opts.hostId) {
      this.joinSession(opts.hostId)
    } else {
      throw new Error('Failed to initialize WebRTCPeerCoordinator')
    }
  }

  private keepAlive() {
    const { sessionClient: client } = this
    if (!client) return

    // TODO: allow disconnect while app is inactive

    if (client.connected) {
      client.ping()
    } else {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  private getClient() {
    return createClient({
      server: METASTREAM_SIGNAL_SERVER,
      peerOpts: {
        config: {
          iceServers: METASTREAM_ICE_SERVERS
        }
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
    this.intervalId = setInterval(this.keepAlive, KEEP_ALIVE_INTERVAL) as any

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
    } finally {
      client.close()
    }

    console.debug('Joined signal client session', peer)
    await this.authenticatePeer(peer, hostId)
  }

  close() {
    if (this.sessionClient) {
      this.sessionClient.removeListener('peer', this.authenticatePeer)
      this.sessionClient.close()
      this.sessionClient = undefined
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    this.connecting.forEach(conn => conn.close())
    this.connecting.clear()
  }

  private async authenticatePeer(peer: SimplePeer.Instance, peerId?: string) {
    const peerPublicKey = peerId ? sodium.from_hex(peerId) : undefined
    const userPublicKey = await mutualHandshake(peer, localUser().id, peerPublicKey)

    if (!userPublicKey) {
      console.error('Failed to authenticate with peer', peer.address())
      peer.destroy()
      return
    }

    const userId = sodium.to_hex(userPublicKey)
    const netId = new NetUniqueId(userPublicKey)
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
