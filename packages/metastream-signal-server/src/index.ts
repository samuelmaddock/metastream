import { EventEmitter } from 'events'
import { IncomingMessage } from 'http'

import WebSocket, { Server } from 'ws'
import sodium from 'libsodium-wrappers'
import { Request, MessageType, RoomID, ClientID } from './types'
import { SignalData } from 'simple-peer'

// :( https://github.com/jedisct1/libsodium/issues/672
process.removeAllListeners('unhandledRejection')

const DEFAULT_PORT = 27064

let clientCounter: ClientID = 0

const isValidRoom = (pk: string) => typeof pk === 'string' && pk.length == 64
const isValidOffer = (offer: any): offer is SignalData =>
  typeof offer === 'object' && (offer.hasOwnProperty('sdp') || offer.hasOwnProperty('candidate'))

const enum ClientStatus {
  Unauthed,
  PendingAuth,
  Authed
}

interface Client {
  id: ClientID
  socket: WebSocket
  status: ClientStatus
  authSecret?: Uint8Array
  pendingRoom?: RoomID
  room?: RoomID
}

interface Room {
  id: RoomID
  clients: Set<ClientID>
  host: ClientID
}

export class SignalServer extends EventEmitter {
  private clients = new Map<ClientID, Client>()
  private rooms = new Map<RoomID, Room>()

  constructor(private wsServer: Server) {
    super()
    this.onConnection = this.onConnection.bind(this)
    this.wsServer.on('connection', this.onConnection)
  }

  private log(...args: any[]) {
    console.log('[SignalServer]', ...args)
  }

  private logError(...args: any[]) {
    console.error('[SignalServer]', ...args)
  }

  reset() {
    this.rooms.forEach(room => {
      this.closeRoom(room.id)
    })
  }

  close() {
    this.reset()
    this.wsServer.off('connection', this.onConnection)
    this.wsServer.close()
  }

  private sendTo(client: Client, json: Request) {
    const data = JSON.stringify(json)
    client.socket.send(data)
  }

  private addClient(socket: WebSocket): Client {
    const id = ++clientCounter
    const client = { id, socket, status: ClientStatus.Unauthed }
    this.clients.set(id, client)
    return client
  }

  private removeClient(id: ClientID) {
    const client = this.clients.get(id)
    if (!client) return
    this.clients.delete(id)

    const { readyState } = client.socket
    if (readyState !== WebSocket.CLOSED || readyState !== WebSocket.CLOSING) {
      client.socket.close()
    }

    if (client.room) {
      this.removeClientFromRoom(client)
    }
  }

  private removeClientFromRoom(client: Client) {
    const roomId = client.room
    const room = roomId && this.rooms.get(roomId)
    if (!room) return

    room.clients.delete(client.id)
    client.room = undefined

    if (room.host === client.id) {
      this.closeRoom(room.id)
    }
  }

  private closeRoom(id: RoomID) {
    const room = this.rooms.get(id)
    if (!room) return

    room.clients.forEach(clientId => this.removeClient(clientId))
    this.rooms.delete(id)

    this.emit('close-room', id)
  }

  private onConnection(socket: WebSocket, req: IncomingMessage) {
    const client = this.addClient(socket)
    const { id } = client
    const addr = req.connection.remoteAddress || 'unknown'
    this.log(`connect[${id}] ${addr}`)

    socket.on('message', msg => {
      this.log(`received[${id}]: ${msg.toString()}`)
      let req
      try {
        req = JSON.parse(msg.toString()) as Request
      } catch {
        this.log(`invalid request [${id}]`)
        socket.close()
        return
      }

      try {
        this.dispatchRequest(client, req)
      } catch (e) {
        this.logError('Error dispatching request:', e)
        this.removeClient(client.id)
      }
    })

    socket.once('close', () => {
      this.log(`disconnect[${id}] ${addr}`)
      this.removeClient(client.id)
    })

    socket.on('error', err => {
      this.logError('WS error: ', err)
    })
  }

  private dispatchRequest(client: Client, req: Request) {
    switch (req.t) {
      case MessageType.Ping:
        this.sendTo(client, { t: MessageType.Pong })
        break
      case MessageType.CreateRoom:
        this.createRoom(client, req.id)
        break
      case MessageType.AuthResponse:
        this.validateAuth(client, req.c)
        break
      case MessageType.JoinRoom:
        this.joinRoom(client, req.id, req.o)
        break
      case MessageType.CandidateOffer:
        this.brokerOffer(client, req.o, req.f || client.id, req.to)
        break
      default:
        this.log('Unknown request', req)
        client.socket.close()
    }
  }

  /** Check if client is authenticated and issue challenge if not. */
  private authCheck(client: Client, publicKey: string) {
    if (client.status === ClientStatus.Authed) return true
    else if (client.status === ClientStatus.PendingAuth) return false
    else if (!isValidRoom(publicKey)) return false

    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
    const box = sodium.crypto_box_seal(nonce, sodium.from_hex(publicKey))
    const challenge = sodium.to_base64(box, sodium.base64_variants.URLSAFE_NO_PADDING)

    client.status = ClientStatus.PendingAuth
    client.authSecret = nonce

    this.sendTo(client, {
      t: MessageType.AuthChallenge,
      c: challenge
    })

    return false
  }

  private validateAuth(client: Client, challenge: string) {
    if (client.status !== ClientStatus.PendingAuth) return

    const secret =
      typeof challenge === 'string' &&
      sodium.from_base64(challenge, sodium.base64_variants.URLSAFE_NO_PADDING)

    if (secret && sodium.to_hex(client.authSecret!) === sodium.to_hex(secret)) {
      client.status = ClientStatus.Authed

      if (typeof client.pendingRoom === 'string') {
        const room = client.pendingRoom
        client.pendingRoom = undefined
        this.createRoom(client, room)
      }
    } else {
      client.socket.close()
    }
  }

  private createRoom(client: Client, id: RoomID) {
    if (!isValidRoom(id)) {
      this.log(`invalid room id [${client.id}]`)
      client.socket.close()
      return
    }

    if (!this.authCheck(client, id)) {
      if (!client.pendingRoom) {
        client.pendingRoom = id
      }
      return
    }

    // Room already exists
    if (this.rooms.has(id)) {
      client.socket.close()
      return
    }

    const clients = new Set([client.id])
    const room: Room = { id, clients, host: client.id }
    this.rooms.set(id, room)
    client.room = id

    this.sendTo(client, {
      t: MessageType.CreateRoomSuccess
    })

    this.log(`Created room ${id} [${client.id}]`)
    this.emit('create-room', id)
  }

  private joinRoom(client: Client, roomId: RoomID, offer: SignalData) {
    if (!isValidRoom(roomId)) {
      this.log(`Client [${client.id}] attempted to connect to invalid room '${roomId}'`)
      client.socket.close()
      return
    }

    if (!isValidOffer(offer)) {
      this.log(`Client [${client.id}] send an invalid offer while joining '${roomId}'`)
      client.socket.close()
      return
    }

    const room = this.rooms.get(roomId)
    if (!room) {
      client.socket.close()
      return
    }

    room.clients.add(client.id)
    client.room = roomId

    this.brokerOffer(client, offer, client.id)
  }

  private brokerOffer(client: Client, offer: SignalData, from: ClientID, to?: ClientID) {
    if (!client.room) return
    if (!isValidOffer(offer)) return

    const room = this.rooms.get(client.room)
    if (!room) return

    if (typeof to === 'number') {
      // only host can send offers to specific clients
      if (room.host !== client.id) return
      if (!room.clients.has(to)) return

      const targetClient = this.clients.get(to)
      if (!targetClient) return

      this.sendTo(targetClient, {
        t: MessageType.CandidateOffer,
        o: offer
      })
    } else {
      const host = this.clients.get(room.host)
      if (!host) return

      this.sendTo(host, {
        t: MessageType.CandidateOffer,
        o: offer,
        f: from
      })
    }
  }
}

export interface Options {
  port?: number
}

export default async (opts: Options) => {
  await sodium.ready
  const ws = new Server({ port: opts.port || DEFAULT_PORT })
  return new SignalServer(ws)
}
