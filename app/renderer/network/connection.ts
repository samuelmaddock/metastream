import { EventEmitter } from 'events'

export class NetUniqueId<T = any> {
  id: T

  constructor(id: T) {
    this.id = id
  }

  toString(): string {
    return this.id + ''
  }

  equals(other: NetUniqueId<T>): boolean {
    return this.id === other.id
  }
}

abstract class NetConnection extends EventEmitter {
  id: NetUniqueId
  connected?: boolean

  protected authed: boolean = false

  constructor(id: NetUniqueId) {
    super()
    this.id = id
  }

  abstract send(data: Buffer): void

  receive = (data: Buffer): void => {
    this.emit('data', data)
  }

  close = (): void => {
    this.connected = false
    this.onClose()
  }

  protected onClose(): void {
    this.emit('close')
    this.removeAllListeners()
  }

  protected onConnect = (): void => {
    this.connected = true
    this.emit('connect')
  }

  protected onError = (e: Error): void => {
    console.error(`Connection error [${this.id}]`, e)
    this.close()
  }

  abstract getIP(): string
  abstract getPort(): string

  toString(): string {
    return `${this.id.toString()} (${this.getIP()}:${this.getPort()})`
  }

  /** Invoked when the client is fully authenticated. */
  auth() {
    if (this.authed) {
      throw new Error(`Client already authed [${this}]`)
    }

    this.authed = true
    this.emit('authed')
  }

  /** Whether the client is fully authenticated. Should only send messages if this is true. */
  isAuthed() {
    return this.authed
  }
}

export default NetConnection
