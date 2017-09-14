import React, { Component } from 'react';
import { IMessage } from 'lobby/reducers/chat';
import { Message } from './Message';
import styles from './Chat.css';

interface IProps {
  messages: IMessage[];
}

export class Messages extends Component<IProps> {
  render(): JSX.Element | null {
    const messages = this.props.messages.map((message, idx) => {
      return <Message key={idx} message={message} />;
    });

    return <ul className={styles.messages}>{messages}</ul>;
  }
}
