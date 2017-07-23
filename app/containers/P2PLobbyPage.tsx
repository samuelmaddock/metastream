import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { IReactReduxProps } from 'types/redux';

import SimplePeer from "simple-peer";
import { pack, unpack } from 'utils/lzw';

import { IAppState } from "reducers";

import { requestLobbies, ILobbyRequestResult, IChatMessage } from 'actions/steamworks';
import { NetworkState } from "types/network";
import { Lobby } from "components/Lobby";

interface IRouteParams {
  lobbyId: string;
}

interface IProps extends RouteComponentProps<IRouteParams> {
}

interface IState {
  isOwner: boolean;
  signal?: Object;
}

const iceServers = [
  { url: 'stun:stun3.l.google.com:19302' }
];

const encode = (signal: Object) => btoa(JSON.stringify(signal));
const decode = (signal: string) => JSON.parse(atob(signal));

(window as any).encode = encode;
(window as any).decode = decode;

export class _LobbyPage extends Component<IProps, IState> {
  constructor() {
    super();
    this.state = {
      isOwner: window.location.href.endsWith('owner')
    }
  }

  componentDidMount(): void {
    if (this.state.isOwner) {
      this.createLobby();
    }
  }

  componentWillUnmount(): void {
    this.leaveLobby();
  }

  private getLobbyId(): string {
    const { match } = this.props;
    const lobbyId = match.params.lobbyId;
    return lobbyId;
  }

  render() {
    return (
      <main>
        <h1>P2P Lobby</h1>
        {this.state.isOwner ?
          this.renderServer() :
          this.renderClient()}
      </main>
    );
  }

  private renderServer(): JSX.Element {
    return (
      <div>
        <div style={{wordWrap: 'break-word'}}>
          {this.state.signal}
        </div>
      </div>
    );
  }

  private joinInput: HTMLInputElement | null;

  private renderClient(): JSX.Element {
    return (
      <div>
        <input ref={e => { this.joinInput = e; }}
               type="text"
               placeholder="Enter signal" />
        <button type="button"
                onClick={this.joinLobby.bind(this)}>Connect</button>
      </div>
    );
  }

  //
  // LOBBY SETUP
  //

  private peerConn: SimplePeer.Instance;

  private createPeer(): SimplePeer.Instance {
    return new SimplePeer({
      initiator: !!this.state.isOwner,
      trickle: false,
      config: {
        iceServers
      }
    });
  }

  private createLobby(): void {
    const { isOwner } = this.state;
    if (!isOwner) { return; }

    console.log('CREATE LOBBY OWNER');

    let p = this.createPeer();

    p.on('error', err => {
      console.log('peer error', err);
    });

    p.on('connect', () => {
      console.log('peer connect');
    });

    p.on('data', data => {
      console.log('peer data', data);
    });

    p.on('signal', (data: Object) => {
      console.log('server peer signal', data);

      const signal = encode(data);
      this.setState({ signal });
    });

    this.peerConn = p;
    (window as any).PEER = p;
  }

  private joinLobby(): void {
    const signal = decode(this.joinInput!.value);

    let p = this.createPeer();

    p.on('error', err => {
      console.log('peer error', err);
    });

    p.on('connect', () => {
      console.log('peer connect');
    });

    p.on('data', data => {
      console.log('peer data', data);
    });

    p.on('signal', (data: Object) => {
      console.log('client peer signal', data);

      const signal = encode(data);
      console.log(signal);
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

  //
  // LOBBY NETWORKING
  //

  private sendMessage = (msg: string) => {
    // TODO: send message to peer
  };
}

export const P2PLobbyPage = _LobbyPage;
