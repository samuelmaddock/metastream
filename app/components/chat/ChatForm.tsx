import React, { Component } from 'react';
import { IMessage } from 'lobby/reducers/chat';

import styles from './Chat.css';
import { CHAT_MAX_MESSAGE_LENGTH } from 'constants/chat';

interface IProps {
  send: (text: string) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export class ChatForm extends Component<IProps> {
  private submitText = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const target = event.currentTarget;

    if (event.key === 'Enter') {
      event.preventDefault();

      const text = target.value;
      this.props.send(text);

      target.value = '';
      target.blur();
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
          maxLength={CHAT_MAX_MESSAGE_LENGTH}
          onFocus={this.props.onFocus}
          onBlur={this.props.onBlur}
        />
      </div>
    );
  }
}
