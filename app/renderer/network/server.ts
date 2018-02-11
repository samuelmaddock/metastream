import { EventEmitter } from 'events'
import NetConnection, { NetUniqueId } from './connection'

interface INetServerEvents {
  on(eventName: 'connect', cb: (conn: NetConnection) => void): this
  on(eventName: 'data', cb: (data: Buffer) => void): this
}

export interface INetServerOptions {
  isHost: boolean
}

abstract class NetServer extends EventEmitter implements INetServerEvents {
  protected connections: Map<string, NetConnection> = new Map()
  protected isHost: boolean

  constructor(opts: INetServerOptions) {
    super()
    this.isHost = opts.isHost
  }

  protected connect(conn: NetConnection): void {
    console.log(`[NetServer] New client connection from ${conn}`)

    {
      const prevConn = this.getClientById(conn.id)
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
    this.emit('connect', conn)
  }

  protected disconnect(conn: NetConnection): void {
    this.emit('disconnect', conn)
    console.log(`[NetServer] Client ${conn} has disconnected`)
    const id = conn.id.toString()
    this.connections.delete(id)
    conn.removeAllListeners()

    if (!this.isHost) {
      this.close()
    }
  }

  protected getClientById(clientId: NetUniqueId) {
    return this.connections.get(clientId.toString())
  }

  protected forEachClient(func: (conn: NetConnection) => void) {
    this.connections.forEach(conn => func(conn))
  }

  close(): void {
    this.forEachClient(conn => conn.close())
    this.connections.clear()
    this.emit('close')
  }

  protected receive(conn: NetConnection, data: Buffer) {
    this.emit('data', conn, data)
  }

  send(data: Buffer): void {
    this.forEachClient(conn => conn.send(data))
  }

  sendTo(clientId: NetUniqueId, data: Buffer): void {
    const conn = this.getClientById(clientId)
    if (conn) {
      conn.send(data)
    } else {
      throw `No client found with an ID of '${clientId}'`
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
