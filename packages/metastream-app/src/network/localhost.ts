import NetConnection, { NetUniqueId } from './connection'
import { PlatformService } from 'platform'

class LocalHostConnection extends NetConnection {
  id!: NetUniqueId & { privateKey: Uint8Array }

  constructor() {
    const id = PlatformService.getLocalId()
    super(id)
    this.authed = true
  }
  send(data: Buffer): void {
    throw new Error('Attempted to send data to LocalHost')
  }
  getIP(): string {
    return '127.0.0.1'
  }
  getPort(): string {
    return '0'
  }
}

let client: LocalHostConnection

const localUser = () => {
  if (!client) {
    client = new LocalHostConnection()
  }
  return client
}

export const localUserId = () => localUser().id.toString()

export default localUser
