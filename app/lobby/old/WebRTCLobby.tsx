import * as React from 'react';
import { steamworks } from "steam";
import SimplePeer from "simple-peer";
import { ILobbyProps, LobbyComponent, ILobbyMessage, INetAction } from "lobby/types";
import { Deferred } from "utils/async";

import { EventEmitter } from 'events';
import { GameLobby } from "lobby/GameLobby";

interface IProps extends ILobbyProps {
}

const encodeSignal = (signal: Object) => btoa(JSON.stringify(signal));
const decodeSignal = (signal: string) => JSON.parse(atob(signal));

const iceServers = [
  { url: 'stun:stun3.l.google.com:19302' }
];

type SignalData = Object;

enum MessageType {
  RequestJoin = 1,
  Offer,
  Answer
}

type IMessageFrame =
  { type: MessageType.RequestJoin, data: undefined } |
  { type: MessageType.Offer, data: string, to: string } |
  { type: MessageType.Answer, data: string, to: string };

class P2PConnection extends EventEmitter {
  id: string;

  private peer?: SimplePeer.Instance;
  private signalData: SignalData;
  private signalDeferred: Deferred<SignalData>;

  constructor(userId: string, peer: SimplePeer.Instance) {
    super();

    this.id = userId;
    this.peer = peer;
    this.signalDeferred = new Deferred();

    peer.on('error', err => {
      console.log('peer error', err);
    });

    peer.on('connect', () => {
      console.log('peer connect');
    });

    peer.on('signal', this.onSignal);
    peer.on('data', this.onReceive);
    peer.on('close', this.onClose);
  }

  private onSignal = (signal: SignalData) => {
    this.signalData = signal;
    this.signalDeferred.resolve(signal);
  }

  private onReceive = (data: Buffer): void => {
    this.emit('data', data);
  }

  private onClose = (): void => {
    console.log('Connection closed', this.id);
    if (this.peer) {
      this.peer.removeAllListeners();
      this.peer = undefined;
      this.emit('close');
    }
  }

  async getSignal(): Promise<SignalData> {
    return this.signalDeferred.promise;
  }

  signal(signal: SignalData): void {
    if (this.peer) {
      this.peer.signal(signal);
    }
  }

  send(data: Buffer): void {
    if (this.peer) {
      this.peer.send(data);
    }
  }

  close(): void {
    if (this.peer) {
      this.peer.destroy();
    }
  }
}

export class WebRTCLobby extends LobbyComponent<IProps> {
  private peers: {
    [key: string]: P2PConnection | undefined;
  } = {};

  private lobbySend: (data: Buffer) => void;

  private gameLobby: GameLobby | null;

  constructor(props: IProps) {
    super(props);

    this.lobbySend = props.lobbySend;
  }

  render(): JSX.Element {
    return (
      <GameLobby
        ref={e => { this.gameLobby = e; }}
        host={this.props.host}
        hostId={this.props.hostId}
        send={this.send.bind(this)} />
    );
  }

  private sendJoinRequest(): void {
    const msg = { type: MessageType.RequestJoin } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobbySend(buf);
  }

  private sendOffer(signal: SignalData, userId: string): void {
    const msg = {
      type: MessageType.Offer,
      data: encodeSignal(signal),
      to: userId
    } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobbySend(buf);
  }

  private sendAnswer(signal: Object): void {
    const msg = {
      type: MessageType.Answer,
      data: encodeSignal(signal)
    } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobbySend(buf);
  }

  lobbyConnect(): void {
    console.log('lobby connect', this.props);

    if (!this.props.host) {
      this.sendJoinRequest();
    }
  }

  lobbyReceive(message: ILobbyMessage): void {
    let msg;

    try {
      msg = JSON.parse(message.data.toString('utf-8')) as IMessageFrame;
    } catch (e) {
      console.error('Failed to read lobby message', message);
      return;
    }

    // TODO: need to validate this by checking steam lobby owner
    switch (msg.type) {
      case MessageType.RequestJoin:
        if (this.props.host) {
          const conn = this.createPeer(message.userId);
          conn.getSignal().then(signal => {
            this.sendOffer(signal, message.userId);
          });
        }
        return;
      case MessageType.Offer:
        if (!this.props.host && (msg as any).to === this.props.localId) {
          const signal = decodeSignal(msg.data!);
          this.joinLobby(message.userId, signal);
        }
        break;
      case MessageType.Answer:
        if (this.props.host) {
          const signal = decodeSignal(msg.data!);
          const conn = this.peers[message.userId];
          if (conn) {
            conn.signal(signal);
          }
        }
        break;
    }
  }

  //
  // LOBBY SETUP
  //

  private createPeer(userId: string): P2PConnection {
    const peer = new SimplePeer({
      initiator: !!this.props.host,
      trickle: false,
      config: {
        iceServers
      }
    });

    const conn = new P2PConnection(userId, peer);
    this.peers[userId] = conn;

    conn.on('data', (data: Buffer) => {
      this.receive(conn, data);
    });

    conn.on('close', () => {
      // TODO: emit event?
      this.peers[userId] = undefined;
    })

    return conn;
  }

  private forEachPeer(func: (peer: P2PConnection) => void) {
    for (let id in this.peers) {
      const conn = this.peers[id];
      if (this.peers.hasOwnProperty(id) && conn) {
        func(conn);
      }
    }
  }

  private async joinLobby(hostId: string, signal: string): Promise<void> {
    const conn = this.createPeer(hostId);
    conn.signal(signal);

    const answer = await conn.getSignal();
    this.sendAnswer(answer);
  }

  private leaveLobby(): void {
    this.forEachPeer(conn => {
      conn.close();
    });
  }

  private send<T>(action: INetAction<T>): void {
    const data = new Buffer(JSON.stringify(action), 'utf-8');

    if (this.props.host) {
      this.forEachPeer(conn => {
        conn.send(data);
      });
    } else {
      this.peers[this.props.hostId]!.send(data);
    }
  }

  private receive = (conn: P2PConnection, data: Buffer) => {
    const action = JSON.parse(data.toString('utf-8'));

    if (this.gameLobby) {
      this.gameLobby.receive({
        userId: conn.id,
        ...action
      });
    }
  }
}
