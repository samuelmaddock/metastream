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

interface IState {
  focused?: boolean;
}

export class Chat extends Component<IProps, IState> {
  private form: ChatForm | null;
  private messages: Messages | null;

  state: IState = {};

  componentDidMount(): void {
    document.addEventListener('keypress', this.onKeyPress, false);
    document.addEventListener('keydown', this.onKeyDown, false);
  }

  componentWillUnmount(): void {
    document.removeEventListener('keypress', this.onKeyPress, false);
    document.removeEventListener('keydown', this.onKeyDown, false);
  }

  render(): JSX.Element | null {
    return (
      <div
        className={cx(this.props.className, styles.container, {
          [styles.focused]: this.state.focused
        })}
      >
        <div className={styles.wrapper}>
          <div className={styles.background} />
          <div className={styles.foreground}>
            <Messages
              ref={e => {
                this.messages = e;
              }}
              messages={this.props.messages}
            />
            <ChatForm
              ref={e => {
                this.form = e;
              }}
              send={this.props.sendMessage}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
            />
          </div>
        </div>
      </div>
    );
  }

  private onFocus = (): void => {
    this.setState({ focused: true });
  };

  private onBlur = (): void => {
    this.setState({ focused: false });
  };

  private onKeyPress = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'Enter':
        if (!this.state.focused && this.form) {
          event.preventDefault();
          this.form.focus();
        }
        break;
    }
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'Escape':
        if (this.state.focused && this.form) {
          event.preventDefault();
          this.form.dismiss();
          this.messages!.scrollToBottom();
        }
    }
  };
}
