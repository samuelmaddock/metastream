import { EventEmitter } from 'events'
import http, { IncomingMessage, STATUS_CODES } from 'http'

import WebSocket, { Server } from 'ws'
import sodium from 'libsodium-wrappers'
import { Request, MessageType, RoomID, ClientID } from './types'
import { SignalData } from 'simple-peer'

// :( https://github.com/jedisct1/libsodium/issues/672
process.removeAllListeners('unhandledRejection')

const DEBUG = process.env.NODE_ENV !== 'production'
const DEFAULT_PORT = 27064

let clientCounter: ClientID = 0

const getIP = (req: IncomingMessage) =>
  (req.headers['x-forwarded-for'] as string) || req.connection.remoteAddress
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
  ip?: string
  socket: WebSocket
  status: ClientStatus
  authSecret?: Uint8Array
  pendingRoom?: RoomID
  room?: RoomID
  created: number
}

interface Room {
  id: RoomID
  clients: Set<ClientID>
  host: ClientID
  created: number
  clientCounter: number
}

interface Credentials {
  username: string
  password: string
}

interface SignalServerOptions {
  wsServer: Server
  credentials?: Credentials
}

export class SignalServer extends EventEmitter {
  private wsServer: Server
  private credentials?: Credentials
  private roomCounter = 0
  private clients = new Map<ClientID, Client>()
  private rooms = new Map<RoomID, Room>()

  constructor(opts: SignalServerOptions) {
    super()
    this.onConnection = this.onConnection.bind(this)
    this.wsServer = opts.wsServer
    this.wsServer.on('connection', this.onConnection)
    this.credentials = opts.credentials
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

  httpHandler(req: IncomingMessage, res: http.ServerResponse) {
    if (this.credentials) {
      try {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        if (url && url.pathname === '/stats') {
          this.statsHandler(req, res)
          return
        }
      } catch {}
    }

    // Upgrade required
    const body = STATUS_CODES[426]
    res.writeHead(426, {
      'Content-Length': body ? body.length : 0,
      'Content-Type': 'text/plain'
    })
    res.end(body)
  }

  private statsHandler(req: IncomingMessage, res: http.ServerResponse) {
    const credentials = this.credentials!

    const header = req.headers['authorization'] || '',
      token = header.split(/\s+/).pop() || '',
      auth = Buffer.from(token, 'base64').toString(),
      parts = auth.split(/:/),
      username = parts[0],
      password = parts[1]

    if (!(credentials.username === username && credentials.password === password)) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic'
      })
      res.end()
      return
    }

    const json = {
      uptime: process.uptime(),
      clientCounter,
      roomCounter: this.roomCounter,
      rooms: Array.from(this.rooms).map(([id, room]) => ({
        id,
        created: new Date(room.created).toISOString(),
        clientCounter: room.clientCounter
      })),
      clients: Array.from(this.clients).map(([id, client]) => ({
        id,
        ip: client.ip,
        created: new Date(client.created).toISOString(),
        status: client.status,
        pendingRoom: client.pendingRoom,
        room: client.room
      }))
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(json))
  }

  private sendTo(client: Client, json: Request) {
    const data = JSON.stringify(json)
    client.socket.send(data)
  }

  private addClient(socket: WebSocket, ip?: string): Client {
    const id = ++clientCounter
    const client: Client = {
      id,
      ip,
      socket,
      status: ClientStatus.Unauthed,
      created: Date.now()
    }
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
    const ip = req && getIP(req)
    const client = this.addClient(socket, ip)
    const { id } = client
    this.log(`connect[${id}] ${ip}`)

    socket.on('message', msg => {
      if (DEBUG) this.log(`received[${id}]: ${msg.toString()}`)
      let request
      try {
        request = JSON.parse(msg.toString()) as Request
      } catch {
        this.log(`Client[${id}] sent invalid JSON request`)
        socket.close()
        return
      }

      try {
        this.dispatchRequest(client, request)
      } catch (e) {
        this.logError(`Error dispatching client[${id}] request[t=${request.t}]:`, e)
        this.removeClient(client.id)
      }
    })

    socket.once('close', () => {
      this.log(`disconnect[${id}] ${ip}`)
      this.removeClient(client.id)
    })

    socket.on('error', err => {
      this.logError(`Client[${id}] WebSocket error:`, err)
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
        this.log(`Client[${client.id}] sent unknown request [t=${req.t}]`)
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

    const secretHex = secret && sodium.to_hex(secret)
    const authSecretHex = client.authSecret && sodium.to_hex(client.authSecret)

    if (secret && authSecretHex === secretHex) {
      client.status = ClientStatus.Authed

      if (typeof client.pendingRoom === 'string') {
        const room = client.pendingRoom
        client.pendingRoom = undefined
        this.createRoom(client, room)
      }
    } else {
      this.log(`Client [${client.id}] failed to solve challenge: ${authSecretHex} !== ${secretHex}`)
      client.socket.close()
    }
  }

  private createRoom(client: Client, id: RoomID) {
    if (!isValidRoom(id)) {
      this.log(`Client[${client.id}] attempted to create invalid room ID`)
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
      this.log(`Client[${client.id}] attempted to create existing room [${id}], recreating room...`)
      this.closeRoom(id)
    }

    const clients = new Set([client.id])
    const room: Room = {
      id,
      clients,
      host: client.id,
      created: Date.now(),
      clientCounter: 0
    }
    this.rooms.set(id, room)
    client.room = id
    this.roomCounter++

    this.sendTo(client, {
      t: MessageType.CreateRoomSuccess
    })

    this.log(`Client[${client.id}] created room ${id}`)
    this.emit('create-room', id)
  }

  private joinRoom(client: Client, roomId: RoomID, offer: SignalData) {
    if (!isValidRoom(roomId)) {
      this.log(`Client[${client.id}] attempted to connect to invalid room '${roomId}'`)
      this.sendTo(client, { t: MessageType.RoomNotFound })
      client.socket.close()
      return
    }

    if (!isValidOffer(offer)) {
      this.log(`Client[${client.id}] sent an invalid offer while joining '${roomId}'`)
      client.socket.close()
      return
    }

    const room = this.rooms.get(roomId)
    if (!room) {
      this.log(`Client[${client.id}] sent an offer to an invalid room[${roomId}]`)
      this.sendTo(client, { t: MessageType.RoomNotFound })
      client.socket.close()
      return
    }

    room.clients.add(client.id)
    room.clientCounter++
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
  credentials?: Credentials
}

export default async (opts: Options) => {
  await sodium.ready

  let signalServer: SignalServer

  const server = http.createServer((req, res) => {
    if (signalServer) {
      signalServer.httpHandler(req, res)
    }
  })

  const port = opts.port || DEFAULT_PORT
  const ws = new Server({ server })
  signalServer = new SignalServer({
    wsServer: ws,
    credentials: opts.credentials
  })

  server.listen(port)

  return signalServer
}
