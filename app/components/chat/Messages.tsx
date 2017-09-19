import React, { Component } from 'react';
import { IMessage } from 'lobby/reducers/chat';
import { Message } from './Message';
import styles from './Chat.css';

interface IProps {
  messages: IMessage[];
}

interface IState {
  newMessage: boolean;
}

export class Messages extends Component<IProps, IState> {
  private list: HTMLElement | null;

  private wasAtBottom: boolean;
  state: IState = { newMessage: false };

  get scrollBottom() {
    return this.list ? this.list.scrollHeight - this.list.clientHeight : 0;
  }

  componentWillReceiveProps(nextProps: IProps): void {
    this.wasAtBottom = this.isScrolledToBottom();
  }

  componentDidUpdate(prevProps: IProps): void {
    if (this.props.messages !== prevProps.messages) {
      if (this.wasAtBottom) {
        this.scrollToBottom();
      }
      else {
        this.setState({ newMessage: true });
      }
    }
  }

  isScrolledToBottom(): boolean {
    if (this.list) {
      if (this.list.scrollTop == this.scrollBottom) {
        return true;
      }
    }

    return false;
  }

  scrollToBottom(): void {
    if (this.list) {
      this.list.scrollTop = this.list.scrollHeight - this.list.clientHeight
    }
  }

  render(): JSX.Element | null {
    const messages = this.props.messages.map((message, idx) => {
      return <Message key={idx} message={message} />;
    });

    return <div className={styles.messages}>
      <ul ref={el => this.list = el} className={styles.list}>{messages}</ul>
      {this.state.newMessage && <div className={styles.newMessages}>You've got new MESSAGES!</div>}
    </div>;
  }
}
