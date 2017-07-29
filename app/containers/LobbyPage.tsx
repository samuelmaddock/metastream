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
  chat?: IChatMessage[];
}

function mapStateToProps(state: IAppState): IConnectedProps {
  return {
    chat: state.lobby.chat
  };
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps;

export class _LobbyPage extends Component<PrivateProps> {
  private steamLobby: SteamMatchmakingLobby;
  private peerCoord?: IRTCPeerCoordinator;
  private server: NetServer;

  componentDidMount(): void {
    const steamLobby = new SteamMatchmakingLobby();
    const peerCoord = SteamRTCPeerCoordinatorFactory(steamLobby);

    const rtcServer = new RTCServer(peerCoord);

    this.steamLobby = steamLobby;
    this.peerCoord = peerCoord;
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
