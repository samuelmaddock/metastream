import { EventEmitter } from 'events'
import * as lpstream from 'length-prefixed-stream'
import { Duplex } from 'stream'
import { KeyPair } from 'libsodium-wrappers'

export class NetUniqueId {
  private id: string

  get publicKey() {
    return this.keyPair.publicKey
  }

  get privateKey() {
    return this.keyPair.privateKey
  }

  constructor(private keyPair: KeyPair) {
    this.id = new Buffer(this.keyPair.publicKey).toString('hex')
  }

  toString(): string {
    return this.id + ''
  }

  /** Override to prevent serialization of keypair */
  toJSON() {
    return this.toString()
  }

  equals(other: NetUniqueId): boolean {
    return this.id === other.id
  }
}

class NetConnection extends EventEmitter {
  id: NetUniqueId
  connected?: boolean

  private encode?: Duplex
  private decode?: Duplex
  private internalStream?: Duplex

  protected authed: boolean = false

  constructor(id: NetUniqueId, stream?: Duplex) {
    super()

    // Must use bind to allow overwrite in subclasses
    this.receive = this.receive.bind(this)

    this.id = id

    if (stream) {
      this.internalStream = stream
      this.encode = lpstream.encode()
      this.decode = lpstream.decode()

      this.encode!.pipe(this.internalStream)
      this.internalStream.pipe(this.decode!)

      this.decode!.on('data', this.receive)
    }
  }

  send(data: Buffer) {
    if (this.encode) {
      this.encode.write(data)
    } else {
      throw new Error('No implementation for NetConnection.send available')
    }
  }

  receive(data: Buffer): void {
    this.emit('data', data)
  }

  close = (): void => {
    this.connected = false
    this.onClose()
  }

  protected onClose(): void {
    if (this.internalStream) {
      if (this.encode) {
        this.encode.unpipe(this.internalStream)
      }
      if (this.decode) {
        this.internalStream.unpipe(this.decode)
        this.decode.removeListener('data', this.receive)
      }
      this.internalStream = undefined
      this.encode = undefined
      this.decode = undefined
    }

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

  getIP(): string {
    return ''
  }
  getPort(): string {
    return ''
  }

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
