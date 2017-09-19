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
  state: IState = {};

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
            <Messages messages={this.props.messages} />
            <ChatForm send={this.props.sendMessage} onFocus={this.onFocus} onBlur={this.onBlur} />
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
}
