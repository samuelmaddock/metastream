import sodium from 'libsodium-wrappers'
import { EventEmitter } from 'events'
import SimplePeer, { SignalData } from 'simple-peer'

import { Request, MessageType, RoomID, ClientID, SignalErrorCode } from './types'
import { waitEvent } from './util'

const DEBUG = process.env.NODE_ENV !== 'production'

export interface KeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

export interface SignalClientOptions {
  peerOpts?: SimplePeer.Options
  connectTimeout?: number
}

export class SignalClient extends EventEmitter {
  get connected() {
    return this.ws.readyState === 1 /* Open */
  }

  private simplePeerOpts: SimplePeer.Options
  private connectingPeers: { [key: number]: SimplePeer.Instance | undefined } = {}
  private connectTimeout: number

  constructor(private ws: WebSocket, opts: SignalClientOptions) {
    super()

    this.simplePeerOpts = opts.peerOpts || {}
    this.connectTimeout = opts.connectTimeout || 15e3

    this.onConnect = this.onConnect.bind(this)
    this.onDisconnect = this.onDisconnect.bind(this)
    this.onError = this.onError.bind(this)
    this.onMessage = this.onMessage.bind(this)
    this.onOfferReceived = this.onOfferReceived.bind(this)

    this.ws.addEventListener('open', this.onConnect)
    this.ws.addEventListener('close', this.onDisconnect)
    this.ws.addEventListener('error', this.onError)
    this.ws.addEventListener('message', this.onMessage)
  }

  close() {
    if (this.ws.readyState < 2) {
      this.ws.close()
    }

    for (const peer of Object.values(this.connectingPeers)) {
      if (peer) peer.destroy()
    }
    this.connectingPeers = {}
  }

  send(data: Request) {
    this.ws.send(JSON.stringify(data))
  }

  ping() {
    this.send({ t: MessageType.Ping })
  }

  private onConnect() {
    this.emit('connect')
  }

  private onDisconnect() {
    this.ws.removeEventListener('open', this.onConnect)
    this.ws.removeEventListener('close', this.onDisconnect)
    this.ws.removeEventListener('message', this.onMessage)
    this.ws.removeEventListener('error', this.onError)

    this.close()
    this.emit('close')
  }

  private onError(err: any) {
    this.emit('error', err)
    this.close()
  }

  private onMessage(event: WebSocketEventMap['message']) {
    const msg = event.data
    let req
    try {
      req = JSON.parse(msg.toString()) as Request
    } catch {
      console.error(`[SignalClient] Invalid request`, msg)
      return
    }

    switch (req.t) {
      case MessageType.AuthChallenge:
        this.emit('challenge', req.c)
        break
      case MessageType.CreateRoomSuccess:
        this.emit('create-room-success')
        break
      case MessageType.CandidateOffer:
        this.emit('offer', req.o, req.f)
        break
      case MessageType.RoomNotFound:
        const err = new Error()
        ;(err as any).code = SignalErrorCode.RoomNotFound
        this.onError(err)
      default:
        break
    }
  }

  private createPeer(options?: SimplePeer.Options): SimplePeer.Instance {
    const peer: any = new SimplePeer({ ...this.simplePeerOpts, ...options })

    // Ignore invalid ICE candidate errors
    // Chrome v75 and Firefox v68 have an incompatibility with trickle ICE
    // https://github.com/feross/simple-peer/issues/503
    peer.destroy = (err: any) => {
      if (typeof err === 'object' && err.code === 'ERR_ADD_ICE_CANDIDATE') return
      peer._destroy(err, () => {})
    }

    return peer
  }

  async createRoom(keyPair: KeyPair) {
    this.send({
      t: MessageType.CreateRoom,
      id: sodium.to_hex(keyPair.publicKey)
    })

    const [challenge] = await waitEvent<string>(this, 'challenge')
    this.solveChallenge(keyPair, challenge)

    await waitEvent<void>(this, 'create-room-success')

    this.on('offer', this.onOfferReceived)
    this.once('close', () => {
      this.removeListener('offer', this.onOfferReceived)
    })
  }

  async joinRoom(id: RoomID) {
    const peer = this.createPeer({ initiator: true })
    const [initialOffer] = await waitEvent<SimplePeer.SignalData>(peer, 'signal')

    this.send({
      t: MessageType.JoinRoom,
      id,
      o: initialOffer
    })

    const onSignal = (offer: SignalData) => {
      this.send({
        t: MessageType.CandidateOffer,
        o: offer
      })
    }
    const onOffer = (offer: SignalData) => {
      peer.signal(offer)
    }

    peer.once('connect', () => {
      peer.removeListener('signal', onSignal)
      this.removeListener('offer', onOffer)
      this.emit('peer', peer)
    })

    peer.on('signal', onSignal)
    this.on('offer', onOffer)

    const connectPromises = [
      waitEvent<SimplePeer.Instance>(this, 'peer', this.connectTimeout),
      waitEvent<Error>(peer, 'error', this.connectTimeout),
      waitEvent<Error>(this, 'error', this.connectTimeout),
      waitEvent<void>(this, 'close', this.connectTimeout)
    ]

    try {
      const [result] = await Promise.race<any[]>(connectPromises)
      if (result instanceof Error) {
        throw result
      } else if (!(result instanceof SimplePeer)) {
        throw new Error('Failed to join room')
      }
    } catch (e) {
      peer.destroy()
      throw e
    } finally {
      connectPromises.forEach(p => p.cancel())
      peer.removeListener('signal', onSignal)
      this.removeListener('offer', onOffer)
    }

    return peer
  }

  private solveChallenge(keyPair: KeyPair, data: string) {
    const challenge = sodium.from_base64(data, sodium.base64_variants.URLSAFE_NO_PADDING)
    const nonce = sodium.crypto_box_seal_open(challenge, keyPair.publicKey, keyPair.privateKey)

    const decoded = sodium.to_base64(nonce, sodium.base64_variants.URLSAFE_NO_PADDING)
    this.send({
      t: MessageType.AuthResponse,
      c: decoded
    })
  }

  private findOrCreatePeer(clientId: ClientID) {
    let peer = this.connectingPeers[clientId]
    if (peer) return peer

    peer = this.createPeer()
    this.connectingPeers[clientId] = peer

    // Clear ref on disconnect
    const onClose = () => (this.connectingPeers[clientId] = undefined)

    // Forward signal data to peer
    const onSignal = (offer: SignalData) => {
      this.send({
        t: MessageType.CandidateOffer,
        o: offer,
        to: clientId
      })
    }

    peer.on('signal', onSignal)
    peer.once('close', onClose)
    peer.once('connect', () => {
      this.connectingPeers[clientId] = undefined
      peer!.removeListener('close', onClose)
      peer!.removeListener('signal', onSignal)
      this.emit('peer', peer)
    })

    return peer
  }

  private onOfferReceived(offer: SignalData, from: ClientID) {
    const peer = this.findOrCreatePeer(from)
    peer.signal(offer)
  }
}

export interface ClientOptions extends SignalClientOptions {
  /** Server URL */
  server: string
  WebSocket?: typeof WebSocket
}

export default async (opts: ClientOptions) => {
  // TODO: validate keys
  await sodium.ready

  const ws = new (opts.WebSocket || WebSocket)(opts.server)
  const client = new SignalClient(ws, opts)

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      client.removeListener('connect', connect)
      client.removeListener('error', error)
    }
    const connect = () => {
      cleanup()
      resolve()
    }
    const error = (err: Error) => {
      cleanup()
      reject(err)
    }
    client.on('connect', connect)
    client.on('error', error)
  })

  return client
}
