import NetConnection from './connection';
import { PlatformService } from 'renderer/platform';

class LocalHostConnection extends NetConnection {
  constructor() {
    const id = PlatformService.getLocalId();
    super(id);
  }
  send(data: Buffer): void {
    throw new Error('Attempted to send data to LocalHost');
  }
  getIP(): string {
    return '127.0.0.1';
  }
  getPort(): string {
    return '0';
  }
}

let client: LocalHostConnection;

const localUser = (): NetConnection => {
  if (!client) {
    client = new LocalHostConnection();
  }
  return client;
};

export const localUserId = () => localUser().id.toString()

export default localUser;
