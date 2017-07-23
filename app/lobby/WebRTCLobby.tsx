import * as React from 'react';
import { steamworks } from "steam";
import SimplePeer from "simple-peer";
import { ILobbyProps, LobbyComponent, ILobbyMessage } from "lobby/types";

interface IProps extends ILobbyProps {
}

const encodeSignal = (signal: Object) => btoa(JSON.stringify(signal));
const decodeSignal = (signal: string) => JSON.parse(atob(signal));

const iceServers = [
  { url: 'stun:stun3.l.google.com:19302' }
];

const enum MessageType {
  RequestJoin,
  Offer,
  Answer
}

interface IMessageFrame<T = any> {
  /** Type */
  type: MessageType;

  /** Data */
  data?: T;
}

export class WebRTCLobby extends LobbyComponent<IProps> {
  private conn?: SimplePeer.Instance;
  private signal?: Object;

  private lobbySend: (data: Buffer) => void;

  constructor(props: IProps) {
    super(props);

    this.lobbySend = props.lobbySend;
  }

  render(): JSX.Element {
    return (
      <div>Connecting...</div>
    );
  }

  private sendJoinRequest(): void {
    const msg = { type: MessageType.RequestJoin } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobbySend(buf);
  }

  private sendOffer(signal: Object): void {
    const msg = { type: MessageType.Offer, data: encodeSignal(signal) } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobbySend(buf);
  }

  private sendAnswer(signal: Object): void {
    const msg = { type: MessageType.Answer, data: encodeSignal(signal) } as IMessageFrame;
    const buf = new Buffer(JSON.stringify(msg), 'utf-8');
    this.lobbySend(buf);
  }

  lobbyConnect(): void {
    console.log('lobby connect', this.props);

    if (this.props.host) {
      this.createLobby();
    } else {
      this.sendJoinRequest();
    }
  }

  lobbyReceive(message: ILobbyMessage): void {
    let type, data;

    try {
      const msg = JSON.parse(message.data.toString('utf-8')) as IMessageFrame;
      type = msg.type;
      data = msg.data;
    } catch (e) {
      console.error('Failed to read lobby message', message);
      return;
    }

    // TODO: need to validate this by checking steam lobby owner
    switch (type) {
      case MessageType.RequestJoin:
        if (this.props.host && this.signal) {
          this.sendOffer(this.signal);
        }
      case MessageType.Offer:
        if (!this.props.host) {
          const signal = decodeSignal(data);
          this.joinLobby(signal);
        }
      case MessageType.Answer:
        if (this.props.host) {
          const signal = decodeSignal(data);
          this.peerConn.signal(signal);
        }
    }
  }

  //
  // LOBBY SETUP
  //

  private peerConn: SimplePeer.Instance;

  private createPeer(): SimplePeer.Instance {
    const peer = new SimplePeer({
      initiator: !!this.props.host,
      trickle: false,
      config: {
        iceServers
      }
    });

    peer.on('error', err => {
      console.log('peer error', err);
    });

    peer.on('connect', () => {
      console.log('peer connect');
    });

    peer.on('data', data => {
      console.log('peer data', data);
    });

    return peer;
  }

  private createLobby(): void {
    console.log('CREATE LOBBY OWNER');

    let p = this.createPeer();

    p.on('signal', (data: Object) => {
      console.log('server peer signal', data);

      this.signal = data;
    });

    this.peerConn = p;
    (window as any).PEER = p;
  }

  private joinLobby(signal: string): void {
    console.log('JOIN LOBBY', signal);

    let p = this.createPeer();

    p.on('signal', (data: Object) => {
      console.log('client peer signal', data);

      this.signal = data;
      this.sendAnswer(this.signal);
    });

    p.signal(signal);

    this.peerConn = p;
    (window as any).PEER = p;
  }

  private leaveLobby(): void {
    if (this.peerConn) {
      this.peerConn.destroy();
    }
  }
}
