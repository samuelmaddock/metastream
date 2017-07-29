import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { IReactReduxProps } from 'types/redux';

import { IAppState } from "reducers";

import { requestLobbies, ILobbyRequestResult, joinLobby, leaveLobby, sendLobbyChatMsg, IChatMessage } from 'actions/steamworks';
import { NetworkState } from "types/network";
import { Lobby } from "components/Lobby";
import { SteamMatchmakingLobby, SteamRTCPeerCoordinatorFactory, SteamRTCPeerCoordinator } from "lobby/steam";
import { RTCServer, IRTCPeerCoordinator } from "lobby/rtc";
import { NetServer } from "lobby/types";

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

export class _LobbyPage extends Component<PrivateProps> {
  private steamLobby: SteamMatchmakingLobby;
  private server: NetServer;
  private host: boolean;

  constructor(props: PrivateProps) {
    super(props);
    this.host = this.lobbyId === 'create';
  }

  componentDidMount(): void {
    const lobbyId = this.lobbyId === 'create' ? undefined : this.lobbyId;
    const steamLobby = new SteamMatchmakingLobby({
      steamId: lobbyId
    });

    const peerCoord = SteamRTCPeerCoordinatorFactory(steamLobby);
    const rtcServer = new RTCServer(peerCoord);

    this.steamLobby = steamLobby;
    this.server = rtcServer;
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
    return <div>Lobby</div>;
  }
}

export const LobbyPage = connect<IConnectedProps, {}, IProps>(mapStateToProps)(_LobbyPage);
