import * as React from 'react';
import { steamworks } from "steam";
import SimplePeer from "simple-peer";
// import { ILobbyProps, LobbyComponent, ILobbyMessage, INetAction, INetResponse } from "lobby/types";
import { Deferred } from "utils/async";

import { EventEmitter } from 'events';
import { Lobby } from "components/Lobby";
import { IChatMessage } from "actions/steamworks";
import { netConnect } from "lobby/net";

interface IProps {
  host: boolean;
  hostId: string;
  // send<T>(action: INetAction<T>): void;
  send<T>(action: any): void;
}

interface IState {
  chatMessages: IChatMessage[];
}

enum NetActions {
  AddChat = 'ADD_CHAT'
}

class _GameLobby extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      chatMessages: []
    }

    // this.send = this.props.send;
  }

  render(): JSX.Element {

    // return (
    //   <Lobby
    //     name="WebRTC Test"
    //     messages={this.state.chatMessages}
    //     sendMessage={(msg) => { this.sendChat(msg); }} />
    // );

    console.log('GameLobby', (this.props as any).chat);

    return <div />;
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
}

export const GameLobby = netConnect<{}, {}, IProps>((state: any) => {
  return { chat: state.chat }
})(_GameLobby);
