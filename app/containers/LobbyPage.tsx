import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { IReactReduxProps } from 'types/redux';

import { IAppState } from "reducers";

import { requestLobbies, ILobbyRequestResult, joinLobby, leaveLobby, sendLobbyChatMsg, IChatMessage } from 'actions/steamworks';
import { NetworkState } from "types/network";
import { Lobby } from "components/Lobby";
import { SteamMatchmakingLobby } from "lobby/SteamLobby";
import { WebRTCLobby } from "lobby/WebRTCLobby";

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
  componentDidMount(): void {
    const lobbyId = this.getLobbyId();
    // this.props.dispatch(joinLobby(lobbyId));
  }

  componentWillUnmount(): void {
    const lobbyId = this.getLobbyId();
    // this.props.dispatch(leaveLobby(lobbyId));
  }

  private getLobbyId(): string {
    const { match } = this.props;
    const lobbyId = match.params.lobbyId;
    return lobbyId;
  }

  render(): JSX.Element {
    if (PRODUCTION || process.env.WITH_STEAM) {
      return (
        <SteamMatchmakingLobby
          host={window.location.href.endsWith('owner')}
          steamId={this.getLobbyId()}
          protocolLobby={WebRTCLobby} />
      );
    } else {
      return <div>Only Steam is supported :(</div>
    }
  }

  private sendMessage = (msg: string) => {
    const lobbyId = this.getLobbyId();
    // this.props.dispatch(sendLobbyChatMsg(lobbyId, msg));
  };
}

export const LobbyPage = connect<IConnectedProps, {}, IProps>(mapStateToProps)(_LobbyPage);
