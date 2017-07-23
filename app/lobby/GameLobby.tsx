import * as React from 'react';
import { steamworks } from "steam";
import SimplePeer from "simple-peer";
import { ILobbyProps, LobbyComponent, ILobbyMessage, INetAction, INetResponse } from "lobby/types";
import { Deferred } from "utils/async";

import { EventEmitter } from 'events';
import { Lobby } from "components/Lobby";

interface IProps {
  send<T>(action: INetAction<T>): void;
}

interface IState {
  chatMessages: string[];
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
    const messages = this.state.chatMessages.map(msg => ({
      senderId: '-1',
      name: 'Unknown',
      text: msg
    }));

    return (
      <Lobby
        name="Test"
        messages={messages}
        sendMessage={(msg) => { this.addChat(msg); }} />
    );
  }

  private send: <T>(action: INetAction<T>) => void;

  receive<T>(action: INetResponse<T>): void {
    switch (action.type) {
      case NetActions.AddChat:
        this.setState({
          chatMessages: [...this.state.chatMessages, action.payload as any as string]
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
    this.receive({
      userId: 'todo',
      ...action
    });
  }
}
