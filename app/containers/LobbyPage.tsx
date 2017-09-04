import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { createStore, Store } from 'redux';
import { IReactReduxProps } from 'types/redux';

import { IAppState } from "reducers";

import { requestLobbies } from 'actions/steamworks';
import { NetworkState } from "types/network";
import { Lobby } from "components/Lobby";
import { RTCServer, IRTCPeerCoordinator } from "lobby/rtc";
import { NetServer } from "lobby/types";
import { netReducer, ILobbyNetState, NetProvider } from "lobby/net";
import { createNetStore } from "lobby/net/redux";
import { GameLobby } from "components/GameLobby";
import { PlatformService } from "platform";

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
  private server: NetServer;
  private host: boolean;
  private netStore: Store<ILobbyNetState>;

  constructor(props: PrivateProps) {
    super(props);

    const lobbyId = props.match.params.lobbyId;
    this.host = lobbyId === 'create';
  }

  private setupLobby(): void {
    if (this.lobbyId) {
      PlatformService.joinLobby(this.lobbyId);
    } else {
      PlatformService.createLobby({
        maxMembers: 4
      });
    }

    const peerCoord = PlatformService.createPeerCoordinator();
    const rtcServer = new RTCServer(peerCoord);

    this.server = rtcServer;

    this.netStore = createNetStore({
      server: rtcServer,
      host: this.host
    });
  }

  componentWillMount(): void {
    this.setupLobby();
  }

  componentWillUnmount(): void {
    PlatformService.leaveLobby(this.lobbyId || '');
    this.server.close();
  }

  private get lobbyId(): string | undefined {
    const { match } = this.props;
    const lobbyId = match.params.lobbyId;
    return lobbyId === 'create' ? undefined : lobbyId;
  }

  render(): JSX.Element {
    if (!this.netStore) {
      return <div>Connecting...</div>;
    }

    const child = (
      <GameLobby
        host={this.host} />
    );

    return (
      <NetProvider store={this.netStore}>
        {child}
      </NetProvider>
    );
  }
}

export const LobbyPage = connect<IConnectedProps, {}, IProps>(mapStateToProps)(_LobbyPage);
