import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { createStore, Store } from 'redux';
import { IReactReduxProps } from 'types/redux';

import { IAppState } from 'reducers';

import { requestLobbies } from 'actions/steamworks';
import { NetworkState } from 'types/network';
import { Lobby } from 'components/Lobby';
import { GameLobby } from 'components/GameLobby';
import { PlatformService } from 'platform';
import { NetServer } from 'network';
import { ILobbyNetState, LobbyReplicatedState, NetProvider } from 'lobby';
import { RTCServer } from 'network/rtc';
import { createNetStore } from 'lobby/redux';

interface IRouteParams {
  lobbyId: string;
}

interface IProps extends RouteComponentProps<IRouteParams> {}

interface IConnectedProps {}

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

  private async setupLobby(): Promise<void> {
    if (this.lobbyId) {
      await PlatformService.joinLobby(this.lobbyId);
    } else {
      await PlatformService.createLobby({
        maxMembers: 4
      });
    }

    this.onJoinLobby();
  }

  private onJoinLobby(): void {
    const peerCoord = PlatformService.createPeerCoordinator();
    const rtcServer = new RTCServer({
      isHost: this.host,
      peerCoord
    });

    this.server = rtcServer;

    this.netStore = createNetStore({
      server: rtcServer,
      host: this.host,
      replicated: LobbyReplicatedState
    });

    if (process.env.NODE_ENV === 'development') {
      (window as any).net = this.netStore;
    }

    this.forceUpdate();
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

    const child = <GameLobby host={this.host} />;

    return <NetProvider store={this.netStore}>{child}</NetProvider>;
  }
}

export const LobbyPage = connect<IConnectedProps, {}, IProps>(mapStateToProps)(_LobbyPage);
