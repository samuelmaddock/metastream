import { NetConnection, NetUniqueId } from 'lobby/types';

class LocalHostConnection extends NetConnection {
  constructor() {
    // TODO: get from platform
    const id = new NetUniqueId('0');
    super(id);
  }
  send(data: Buffer): void {
    throw new Error('Attempted to send data to LocalHost');
  }
  getIP(): string {
    throw '127.0.0.1';
  }
  getPort(): string {
    return '0';
  }
}

let client: LocalHostConnection;

export const localUser = (): NetConnection => {
  if (!client) {
    client = new LocalHostConnection();
  }
  return client;
};
