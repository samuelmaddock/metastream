import * as React from 'react';

import { Lobby } from "components/Lobby";
import { netConnect, ILobbyNetState } from "lobby/net";
import { IReactReduxProps } from "types/redux";
import { server_addChat } from "lobby/net/actions/chat";
import { IChatEntry } from "lobby/net/reducers/chat";

interface IProps {
  host: boolean;
}

interface IConnectedProps {
  chat: IChatEntry[];
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps;

class _GameLobby extends React.Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <Lobby
        name="WebRTC Test"
        messages={this.props.chat}
        sendMessage={this.sendChat} />
    );
  }

  private sendChat = (msg: string): void => {
    this.props.dispatch(server_addChat(msg));
  }
}

export const GameLobby = netConnect<{}, {}, IProps>((state: ILobbyNetState): IConnectedProps => {
  return { chat: state.chat.entries };
})(_GameLobby);
