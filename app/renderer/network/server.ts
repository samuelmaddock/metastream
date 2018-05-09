import { EventEmitter } from 'events'
import NetConnection, { NetUniqueId } from './connection'

interface INetServerEvents {
  on(eventName: 'connect', cb: (conn: NetConnection) => void): this
  on(eventName: 'data', cb: (data: Buffer) => void): this
}

export interface INetServerOptions {
  isHost: boolean
  coordinators: PeerCoordinator[]
}

class NetServer extends EventEmitter implements INetServerEvents {
  isHost: boolean

  connected: boolean = false
  private connections: Map<string, NetConnection> = new Map()
  private coordinators: PeerCoordinator[] = []

  constructor(opts: INetServerOptions) {
    super()
    this.isHost = opts.isHost
    this.coordinators = [...opts.coordinators]

    for (let coordinator of this.coordinators) {
      coordinator.on('connection', this.connect)
    }
  }

  private connect = (conn: NetConnection): void => {
    console.log(`[NetServer] New client connection from ${conn}`)

    {
      const prevConn = this.getClientById(conn.id.toString())
      if (prevConn) {
        // TODO: notify dropped
        prevConn.close()
        console.log(`[NetServer] Dropped old client for ${conn}`)
      }
    }

    const id = conn.id.toString()
    this.connections.set(id, conn)
    conn.once('close', () => this.disconnect(conn))
    conn.on('data', (data: Buffer) => this.receive(conn, data))

    this.connected = true
    this.emit('connect', conn)
  }

  private disconnect(conn: NetConnection): void {
    const id = conn.id.toString()
    this.connections.delete(id)
    this.emit('disconnect', conn)
    conn.removeAllListeners()

    console.log(`[NetServer] Client ${conn} has disconnected`)

    if (!this.isHost) {
      this.close()
    }
  }

  private getClientById(clientId: string) {
    return this.connections.get(clientId)
  }

  private forEachClient(func: (conn: NetConnection) => void) {
    this.connections.forEach(conn => func(conn))
  }

  close(): void {
    if (this.connected) {
      this.forEachClient(conn => conn.close())
      this.connections.clear()
      this.connected = false

      this.coordinators.forEach(coord => {
        coord.removeListener('connection', this.connect)
        coord.close()
      })

      this.emit('close')
    }
  }

  private receive(conn: NetConnection, data: Buffer) {
    this.emit('data', conn, data)
  }

  send(data: Buffer): void {
    this.forEachClient(conn => conn.send(data))
  }

  sendTo(clientId: string, data: Buffer): void {
    const conn = this.getClientById(clientId)
    if (conn) {
      conn.send(data)
    } else {
      console.error(`No client found with an ID of '${clientId}'`)
    }
  }

  sendToHost(data: Buffer): void {
    if (this.isHost) {
      throw new Error('Attempted to send data to self')
    }

    // If we're not the host, the only other connection we have is the host.
    this.send(data)
  }
}

export default NetServer

interface IPeerCoordinatorEvents {
  /** Subscribe to peer connections. */
  on(eventName: 'connection', listener: (conn: NetConnection) => void): this
}

/**
 * Coordinates signaling of peers.
 */
export abstract class PeerCoordinator extends EventEmitter implements IPeerCoordinatorEvents {
  protected host: boolean = false

  abstract close(): void
}
