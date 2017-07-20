import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { IReactReduxProps } from 'types/redux';

import { IAppState } from "reducers";

import { requestLobbies, ILobbyRequestResult, IChatMessage } from 'actions/steamworks';
import { NetworkState } from "types/network";
import { Lobby } from "components/Lobby";
import { createLobby, leaveLobby } from "actions/lobby";

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
    this.props.dispatch(createLobby());
  }

  componentWillUnmount(): void {
    const lobbyId = this.getLobbyId();
    this.props.dispatch(leaveLobby());
  }

  private getLobbyId(): string {
    const { match } = this.props;
    const lobbyId = match.params.lobbyId;
    return lobbyId;
  }

  render() {
    console.log('P2P LOBBY PAGE', this.props);

    return (
      <Lobby name={this.getLobbyId()}
        messages={this.props.chat || []}
        sendMessage={this.sendMessage} />
    );
  }

  private sendMessage = (msg: string) => {
    const lobbyId = this.getLobbyId();
    // TODO: send message to peer
  };
}

export const P2PLobbyPage = connect<IConnectedProps, {}, IProps>(mapStateToProps)(_LobbyPage);
