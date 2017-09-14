import React, { Component } from 'react';
import { IMessage } from 'lobby/reducers/chat';

import styles from './Chat.css';

interface IProps {
  send: (text: string) => void;
}

export class ChatForm extends Component<IProps> {
  private submitText = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const target = event.currentTarget;

    if (event.key === 'Enter') {
      event.preventDefault();

      const text = target.value;
      this.props.send(text);

      target.value = '';
    }
  };

  render(): JSX.Element | null {
    return (
      <div className={styles.form}>
        <input
          type="text"
          className={styles.messageInput}
          placeholder="Message"
          onKeyPress={this.submitText}
        />
      </div>
    );
  }
}
