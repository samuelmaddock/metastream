import React, { Component } from 'react';
import cx from 'classnames';

import { IMessage } from 'lobby/reducers/chat';

import { Message } from './Message';
import { Messages } from './Messages';
import { ChatForm } from './ChatForm';

import styles from './Chat.css';

interface IProps {
  className?: string;
  messages: IMessage[];
  sendMessage: (text: string) => void;
}

export class Chat extends Component<IProps> {
  render(): JSX.Element | null {
    return (
      <div className={cx(this.props.className, styles.container)}>
        <Messages messages={this.props.messages} />
        <ChatForm send={this.props.sendMessage} />
      </div>
    );
  }
}
