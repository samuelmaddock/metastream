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

  componentDidMount(): void {
    if (this.list) {
      this.list.addEventListener('scroll', this.handleScroll.bind(this));
    }
  }

  componentWillReceiveProps(nextProps: IProps): void {
    this.wasAtBottom = this.isScrolledToBottom();
  }

  componentWillUnmount() {
    if (this.list) {
      this.list.removeEventListener('scroll', this.handleScroll.bind(this));
    }
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

  handleScroll(): void {
    if (this.isScrolledToBottom()) {
      this.setState({ newMessage: false });
    }
  }

  render(): JSX.Element | null {
    const messages = this.props.messages.map((message, idx) => {
      return <Message key={idx} message={message} />;
    });

    return <span className={styles.chatWrapper}>
      <ul ref={el => this.list = el} className={styles.messages}>{messages}</ul>
      {this.state.newMessage && <div className={styles.newMessages} onClick={this.scrollToBottom.bind(this)}>You've got new MESSAGES!</div>}
    </span>;
  }
}
