/** Wrapper around social user IDs. */
import { EventEmitter } from "events";

export class NetUniqueId<T = any> {
  private id: T;

  constructor(id: T) {
    this.id = id;
  }

  toString(): string {
    return this.id + '';
  }
}

export abstract class NetConnection extends EventEmitter {
  id: NetUniqueId;

  protected closed: boolean;

  constructor(id: NetUniqueId) {
    super();
    this.id = id;
  }

  abstract send(data: Buffer): void;

  receive = (data: Buffer): void => {
    this.emit('data', data);
  }

  close = (): void => {
    this.closed = true;
    this.onClose();
  }

  protected onClose(): void {
    this.emit('close');
  }

  protected onConnect = (): void => {
    this.emit('connect');
  }

  abstract getIP(): string;
  abstract getPort(): string;

  toString(): string {
    return `${this.id.toString()} (${this.getIP()}:${this.getPort()})`;
  }
}

export abstract class NetServer extends EventEmitter {
  protected connections: {[key: string]: NetConnection | undefined } = {};

  protected connect(conn: NetConnection): void {
    console.log(`New client connection from ${conn}`);
    const id = conn.id.toString();
    this.connections[id] = conn;
    conn.once('close', () => this.disconnect(conn));
    conn.on('data', (data: Buffer) => this.receive(conn, data));
  }

  protected disconnect(conn: NetConnection): void {
    console.log(`Client ${conn} has disconnected`);
    const id = conn.id.toString();
    this.connections[id] = undefined;
    conn.removeAllListeners();
  }

  protected getClientById(clientId: string) {
    return this.connections[clientId];
  }

  protected forEachClient(func: (conn: NetConnection) => void) {
    for (let id in this.connections) {
      const conn = this.connections[id];
      if (this.connections.hasOwnProperty(id) && conn) {
        func(conn);
      }
    }
  }

  close(): void {
    this.forEachClient(conn => {
      conn.close();
    });

    this.connections = {};
  }

  protected receive(conn: NetConnection, data: Buffer) {
    this.emit('data', conn, data);
  };

  send(data: Buffer): void {
    this.forEachClient(conn => {
      conn.send(data);
    });
  }

  sendTo(clientId: string, data: Buffer): void {
    const conn = this.getClientById(clientId);
    if (conn) {
      conn.send(data);
    } else {
      throw `No client found with an ID of '${clientId}'`;
    }
  }

  sendToHost(data: Buffer): void {

  }
}
