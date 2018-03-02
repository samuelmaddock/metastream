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
  connected: boolean

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
}

export default NetConnection
