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

export abstract class NetServer {
  protected connections: NetConnection[] = [];

  protected connect(conn: NetConnection): void {
    console.log(`New client connection from ${conn}`);
    this.connections.push(conn);
    conn.once('close', () => this.disconnect(conn));
  }

  protected disconnect(conn: NetConnection): void {
    console.log(`Client ${conn} has disconnected`);
    const idx = this.connections.indexOf(conn);
    this.connections.splice(idx, 1);
  }

  close(): void {
    this.connections.forEach(conn => {
      conn.close();
    });

    this.connections = [];
  }
}
