import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { createStore, Store } from 'redux';
import { IReactReduxProps } from 'types/redux';

import { IAppState } from "reducers";

import { requestLobbies, ILobbyRequestResult, joinLobby, leaveLobby, sendLobbyChatMsg, IChatMessage } from 'actions/steamworks';
import { NetworkState } from "types/network";
import { Lobby } from "components/Lobby";
import { SteamMatchmakingLobby, SteamRTCPeerCoordinatorFactory, SteamRTCPeerCoordinator } from "lobby/steam";
import { RTCServer, IRTCPeerCoordinator } from "lobby/rtc";
import { NetServer } from "lobby/types";
import { netReducer, ILobbyNetState, NetProvider } from "lobby/net";
import { createNetStore } from "lobby/net/redux";
import { GameLobby } from "components/GameLobby";

interface IRouteParams {
  lobbyId: string;
}

interface IProps extends RouteComponentProps<IRouteParams> {
}

interface IConnectedProps {
}

function mapStateToProps(state: IAppState): IConnectedProps {
  return {};
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps;

export class _LobbyPage extends Component<PrivateProps, {}> {
  private steamLobby: SteamMatchmakingLobby;
  private server: NetServer;
  private host: boolean;
  private netStore: Store<ILobbyNetState>;

  constructor(props: PrivateProps) {
    super(props);
    this.host = this.lobbyId === 'create';
    this.netStore = createNetStore();
  }

  private setupLobby(): void {
    const lobbyId = this.lobbyId === 'create' ? undefined : this.lobbyId;
    const steamLobby = new SteamMatchmakingLobby({
      steamId: lobbyId
    });

    const peerCoord = SteamRTCPeerCoordinatorFactory(steamLobby);
    const rtcServer = new RTCServer(peerCoord);

    this.steamLobby = steamLobby;
    this.server = rtcServer;
  }

  componentDidMount(): void {
    this.setupLobby();
  }

  componentWillUnmount(): void {
    this.steamLobby.close();
    this.server.close();
  }

  private get lobbyId(): string | undefined {
    const { match } = this.props;
    const lobbyId = match.params.lobbyId;
    return lobbyId === 'create' ? undefined : lobbyId;
  }

  render(): JSX.Element {
    const child = (
      <GameLobby
        host={this.host}
        hostId={this.steamLobby ? this.steamLobby.ownerSteamId : '-1'}
        send={(msg) => { console.log('todo: send', msg); }} />
    );

    return (
      <NetProvider store={this.netStore}>
        {child}
      </NetProvider>
    );
  }
}

export const LobbyPage = connect<IConnectedProps, {}, IProps>(mapStateToProps)(_LobbyPage);
