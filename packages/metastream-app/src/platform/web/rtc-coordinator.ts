import SimplePeer from 'simple-peer'
import createClient, { SignalClient } from '@metastream/signal-server/lib/client'
import { SignalErrorCode } from '@metastream/signal-server/lib/types'

import sodium from 'libsodium-wrappers'
import { backOff } from 'exponential-backoff'

import { NetUniqueId, localUser } from 'network'
import { PeerCoordinator } from 'network/server'
import { RTCPeerConn } from 'network/rtc'
import { mutualHandshake } from './authenticate'
import {
  METASTREAM_SIGNAL_SERVER,
  METASTREAM_ICE_SERVERS,
  NETWORK_TIMEOUT
} from 'constants/network'
import { NetworkError, NetworkErrorCode } from 'network/error'
import { untilDocumentVisible } from 'utils/browser'

/** Interval to ping WebSocket to keep connection open. */
const KEEP_ALIVE_INTERVAL = 9 * 60 * 1000

interface Options {
  host: boolean
  hostId?: string
}

export class WebRTCPeerCoordinator extends PeerCoordinator {
  private closed: boolean = false
  private connecting = new Map<string, RTCPeerConn>()
  private sessionClient?: SignalClient
  private intervalId?: number
  private reconnectTimeoutId?: number

  constructor(opts: Options) {
    super()
    this.host = opts.host
    this.authenticatePeer = this.authenticatePeer.bind(this)
    this.keepAlive = this.keepAlive.bind(this)

    if (this.host) {
      this.createSession().catch(this.serverConnectionClosed)
    } else if (opts.hostId) {
      this.joinSession(opts.hostId).catch(this.handleError)
    } else {
      throw new Error('Failed to initialize WebRTCPeerCoordinator')
    }
  }

  private handleError = (err: NetworkError) => {
    // bubble error up to NetServer
    this.emit('error', err)
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

  private serverConnectionClosed = () => {
    if (this.closed) return
    this.emit('error', new NetworkError(NetworkErrorCode.SignalServerDisconnect))
    this.reconnect()
  }

  private reconnect() {
    backOff(
      async () => {
        if (document.visibilityState !== 'visible') {
          await untilDocumentVisible()
        }

        if (!this.closed) {
          console.debug('Attempting to reconnect to signal server...')
          this.cleanup()
          await this.createSession()
        }
      },
      {
        delayFirstAttempt: true,
        numOfAttempts: Number.MAX_VALUE
      }
    ).then(() => {
      if (this.sessionClient) {
        console.debug('Reconnected to signal server')
        this.emit('error', new NetworkError(NetworkErrorCode.SignalServerReconnect))
      }
    })
  }

  private getClient() {
    return createClient({
      server: METASTREAM_SIGNAL_SERVER,
      connectTimeout: NETWORK_TIMEOUT,
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
      throw new NetworkError(NetworkErrorCode.SignalServerConnectionFailure)
    }

    try {
      await client.createRoom({
        publicKey: localUser().id.publicKey,
        privateKey: localUser().id.privateKey!
      })
    } catch (e) {
      console.error(e)
      throw new NetworkError(
        NetworkErrorCode.SignalServerConnectionFailure,
        'Failed to create room'
      )
    }

    client.on('peer', this.authenticatePeer)
    client.on('close', this.serverConnectionClosed)

    this.sessionClient = client
    this.intervalId = setInterval(this.keepAlive, KEEP_ALIVE_INTERVAL) as any

    console.debug('Created signal client session')
  }

  private async joinSession(hostId: string) {
    let client
    try {
      client = await this.getClient()
    } catch {
      throw new NetworkError(NetworkErrorCode.SignalServerConnectionFailure)
    }

    let peer
    try {
      peer = await client.joinRoom(hostId)
    } catch (e) {
      if (e.code === SignalErrorCode.RoomNotFound) {
        throw new NetworkError(NetworkErrorCode.SignalServerSessionNotFound, 'Session not found')
      } else {
        console.error(e)
        throw new NetworkError(
          NetworkErrorCode.SignalServerConnectionFailure,
          'Failed to join room'
        )
      }
    } finally {
      client.close()
    }

    console.debug('Joined signal client session', peer)
    await this.authenticatePeer(peer, hostId)
  }

  private cleanup() {
    if (this.sessionClient) {
      this.sessionClient.removeListener('peer', this.authenticatePeer)
      this.sessionClient.removeListener('close', this.serverConnectionClosed)
      this.sessionClient.close()
      this.sessionClient = undefined
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = undefined
    }

    this.connecting.forEach(conn => conn.close())
    this.connecting.clear()
  }

  close() {
    this.closed = true
    this.cleanup()
  }

  private async authenticatePeer(peer: SimplePeer.Instance, peerId?: string) {
    const peerPublicKey = peerId ? sodium.from_hex(peerId) : undefined
    const userPublicKey = await mutualHandshake(peer, localUser().id, peerPublicKey)

    if (!userPublicKey) {
      const addr = `${(peer as any).remoteAddress}:${(peer as any).remotePort}`
      peer.destroy()
      throw new NetworkError(
        NetworkErrorCode.PeerAuthenticationFailure,
        `Failed to authenticate with peer [${addr}]`
      )
    }

    const userId = sodium.to_hex(userPublicKey)
    const netId = new NetUniqueId(userPublicKey)
    const conn = new RTCPeerConn(netId, peer)

    console.debug(`Authenticated peer ${userId}`, conn)
    this.emit('connection', conn)
  }
}
