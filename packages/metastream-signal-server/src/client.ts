import sodium from 'libsodium-wrappers'
import { EventEmitter } from 'events'
import SimplePeer, { SignalData } from 'simple-peer'

import { Request, MessageType, RoomID, ClientID } from './types'
import { waitEvent } from './util'

interface KeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

interface SignalClientOptions {
  peerOpts?: SimplePeer.Options
}

export class SignalClient extends EventEmitter {
  private simplePeerOpts: SimplePeer.Options

  private connectingPeers: { [key: number]: SimplePeer.Instance | undefined } = {}

  constructor(private ws: WebSocket, opts: SignalClientOptions) {
    super()

    this.simplePeerOpts = opts.peerOpts || {}

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
    this.ws.close()
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
    if (Object.keys(this.connectingPeers).length) {
      this.connectingPeers = {}
    }

    this.removeListener('offer', this.onOfferReceived)

    this.ws.removeEventListener('open', this.onConnect)
    this.ws.removeEventListener('close', this.onDisconnect)
    this.ws.removeEventListener('message', this.onMessage)
  }

  private onError(err: any) {
    this.emit('error', err)
    this.close()
  }

  private onMessage(event: WebSocketEventMap['message']) {
    const msg = event.data
    console.log(`[SignalClient] received: ${msg.toString()}`)
    let req
    try {
      req = JSON.parse(msg.toString()) as Request
    } catch {
      console.log(`[SignalClient] invalid request`)
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
      default:
        break
    }
  }

  async createRoom(keyPair: KeyPair) {
    this.send({
      t: MessageType.CreateRoom,
      id: sodium.to_hex(keyPair.publicKey)
    })

    const [challenge] = await waitEvent(this, 'challenge')
    this.solveChallenge(keyPair, challenge)

    await waitEvent(this, 'create-room-success')

    this.addListener('offer', this.onOfferReceived)
  }

  async joinRoom(id: RoomID) {
    const peer = new SimplePeer({ ...this.simplePeerOpts, initiator: true })
    const [initialOffer] = await waitEvent(peer, 'signal')

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

    await waitEvent(this, 'peer', 15e3)
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

    peer = new SimplePeer({ ...this.simplePeerOpts })
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

interface ClientOptions extends SignalClientOptions {
  /** Server URL */
  server: string
}

export default async (opts: ClientOptions) => {
  // TODO: validate keys
  await sodium.ready
  const ws = new WebSocket(opts.server)
  const client = new SignalClient(ws, opts)
  await waitEvent(client, 'connect')
  return client
}
