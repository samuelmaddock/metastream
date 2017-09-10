import * as React from 'react';

import { Lobby } from "components/Lobby";
import { netConnect, ILobbyNetState } from "lobby/net";
import { IReactReduxProps } from "types/redux";
import { server_addChat } from "lobby/net/actions/chat";
import { IChatEntry } from "lobby/net/reducers/chat";
import { IUsersState } from "lobby/net/reducers/users";

interface IProps {
  host: boolean;
}

interface IConnectedProps {
  chat: IChatEntry[];
  users: IUsersState;
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps;

class _GameLobby extends React.Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <div>
        <Lobby
          name="WebRTC Test"
          messages={this.props.chat}
          sendMessage={this.sendChat} />
        <h2>Users</h2>
        {Object.keys(this.props.users).map(userId => {
          return (
            <div key={userId}>{this.props.users[userId]!.name}</div>
          );
        })}
      </div>
    );
  }

  private sendChat = (msg: string): void => {
    this.props.dispatch(server_addChat(msg));
  }
}

export const GameLobby = netConnect<{}, {}, IProps>((state: ILobbyNetState): IConnectedProps => {
  return {
    chat: state.chat.entries,
    users: state.users
  };
})(_GameLobby);
