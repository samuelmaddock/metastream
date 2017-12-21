import React, { Component } from 'react';
import { IMessage } from 'renderer/lobby/reducers/chat';
import styles from './Chat.css';

interface IProps {
  message: IMessage;
}

export class Message extends Component<IProps> {
  render(): JSX.Element | null {
    const { message } = this.props;
    const { author } = message;

    return (
      <li className={styles.message}>
        <span className={styles.username} title={author.id}>
          {author.username}
        </span>
        <span>{message.content}</span>
      </li>
    );
  }
}
