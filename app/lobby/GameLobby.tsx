import * as React from 'react';
import { steamworks } from "steam";
import SimplePeer from "simple-peer";
import { ILobbyProps, LobbyComponent, ILobbyMessage, INetAction, INetResponse } from "lobby/types";
import { Deferred } from "utils/async";

import { EventEmitter } from 'events';
import { Lobby } from "components/Lobby";
import { IChatMessage } from "actions/steamworks";

interface IProps {
  host: boolean;
  send<T>(action: INetAction<T>): void;
}

interface IState {
  chatMessages: IChatMessage[];
}

enum NetActions {
  AddChat = 'ADD_CHAT'
}

export class GameLobby extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      chatMessages: []
    }

    this.send = this.props.send;
  }

  render(): JSX.Element {

    return (
      <Lobby
        name="WebRTC Test"
        messages={this.state.chatMessages}
        sendMessage={(msg) => { this.addChat(msg); }} />
    );
  }

  private send: <T>(action: INetAction<T>) => void;

  receive<T>(action: INetResponse<T>): void {
    switch (action.type) {
      case NetActions.AddChat:
        if (this.props.host) {
          this.send(action); // relay to clients
        }

        const chatMessage = {
          senderId: action.userId,
          name: action.userId,
          text: action.payload as any as string
        } as IChatMessage;

        this.setState({
          chatMessages: [...this.state.chatMessages, chatMessage]
        });
        break;
    }
  }

  addChat(msg: string): void {
    const action = {
      type: NetActions.AddChat,
      payload: msg
    } as INetAction<string>;

    this.send(action);

    // always relay actions to host?
    if (this.props.host) {
      this.receive({
        userId: 'host',
        ...action
      });
    }
  }
}
