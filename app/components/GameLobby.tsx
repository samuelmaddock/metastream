import * as React from 'react';

import { Lobby } from 'components/Lobby';
import { IReactReduxProps } from 'types/redux';
import { IChatEntry } from 'lobby/reducers/chat';
import { IUsersState } from 'lobby/reducers/users';
import { server_addChat } from 'lobby/actions/chat';
import { netConnect, ILobbyNetState } from 'lobby';
import { getSessionName } from 'lobby/reducers/session';
import { VideoPlayer } from 'components/lobby/VideoPlayer';

interface IProps {
  host: boolean;
}

interface IConnectedProps {
  chat: IChatEntry[];
  users: IUsersState;
  sessionName?: string;
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps;

class _GameLobby extends React.Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <div>
        <VideoPlayer />
        <Lobby
          name={this.props.sessionName || 'Connecting'}
          messages={this.props.chat}
          sendMessage={this.sendChat}
        />
        <h2>Users</h2>
        {Object.keys(this.props.users).map(userId => {
          return <div key={userId}>{this.props.users[userId]!.name}</div>;
        })}
      </div>
    );
  }

  private sendChat = (msg: string): void => {
    this.props.dispatch(server_addChat(msg));
  };
}

export const GameLobby = netConnect<{}, {}, IProps>((state: ILobbyNetState): IConnectedProps => {
  return {
    chat: state.chat.entries,
    users: state.users,
    sessionName: getSessionName(state)
  };
})(_GameLobby);
