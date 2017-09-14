import React, { Component } from 'react';

import { IMessage } from 'lobby/reducers/chat';

import { Message } from './Message';
import { Messages } from './Messages';
import { ChatForm } from './ChatForm';

import styles from './Chat.css';

interface IProps {
  messages: IMessage[];
  sendMessage: (text: string) => void;
}

export class Chat extends Component<IProps> {
  render(): JSX.Element | null {
    return (
      <div className={styles.container}>
        <Messages messages={this.props.messages} />
        <ChatForm send={this.props.sendMessage} />
      </div>
    );
  }
}
