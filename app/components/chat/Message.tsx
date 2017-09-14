import React, { Component } from 'react';
import { IMessage } from 'lobby/reducers/chat';
import styles from './Chat.css';

interface IProps {
  message: IMessage;
}

export class Message extends Component<IProps> {
  render(): JSX.Element | null {
    const { message } = this.props;

    return (
      <li className={styles.message}>
        <span className={styles.username}>{message.author.username}</span>
        <span>{message.content}</span>
      </li>
    );
  }
}
