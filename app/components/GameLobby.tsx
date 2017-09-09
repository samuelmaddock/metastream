import * as React from 'react';

import { Lobby } from "components/Lobby";
import { netConnect, ILobbyNetState } from "lobby/net";
import { IReactReduxProps } from "types/redux";
import { server_addChat } from "lobby/net/actions/chat";

interface IProps {
  host: boolean;
  // hostId: string;
  // send<T>(action: INetAction<T>): void;
  // send<T>(action: any): void;
}

interface IConnectedProps {
  chat: string[];
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps;

class _GameLobby extends React.Component<PrivateProps> {
  render(): JSX.Element {

    return (
      <Lobby
        name="WebRTC Test"
        messages={this.props.chat.map(msg => ({
          senderId: '-1',
          name: 'Name',
          text: msg
        }))}
        sendMessage={(msg) => { this.sendChat(msg); }} />
    );
  }

  /*private addChat(action: INetResponse<string>): void {
    const chatMessage = {
      senderId: action.userId,
      name: action.userId,
      text: action.payload
    } as IChatMessage;

    this.setState({
      chatMessages: [...this.state.chatMessages, chatMessage]
    });
  }

  private send: <T>(action: INetAction<T>) => void;

  receive<T>(action: INetResponse<T>): void {
    switch (action.type) {
      case NetActions.AddChat:
        if (this.props.host && action.userId !== this.props.hostId) {
          this.send(action); // relay to clients
        }

        this.addChat(action as any as INetResponse<string>);
        break;
    }
  }

  sendChat(msg: string): void {
    const action = {
      type: NetActions.AddChat,
      payload: msg
    } as INetAction<string>;

    this.send(action);

    // always relay actions to host?
    if (this.props.host) {
      this.receive({
        userId: this.props.hostId,
        ...action
      });
    }
  }*/

  private sendChat(msg: string): void {
    this.props.dispatch(server_addChat(msg));
  }
}

export const GameLobby = netConnect<{}, {}, IProps>((state: ILobbyNetState): IConnectedProps => {
  return { chat: state.chat.entries };
})(_GameLobby);
