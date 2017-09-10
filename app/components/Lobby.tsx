import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './ServerBrowser.css';
import { NetworkState } from "types/network";

interface IChatMessage {
  sender: string;
  name: string;
  message: string;
}

interface IProps {
  name: string;
  messages: IChatMessage[];
  sendMessage(msg: string): void;
}

export class Lobby extends Component<IProps> {
  private chatInput: HTMLInputElement | null;

  render(): JSX.Element | null {
    const { name } = this.props;
    return (
      <div className={styles.container} data-tid="container">
        <Link to="/">Go back</Link>
        <h1>Lobby: {name}</h1>
        {this.renderChat()}
      </div>
    );
  }

  private renderChat(): JSX.Element {
    const messages = (this.props.messages || []).map((msg, idx) => {
      return (
        <li key={idx}>
          <div><b title={msg.sender}>{msg.name}</b>: {msg.message}</div>
        </li>
      );
    });

    return (
      <div>
        <ul>{messages}</ul>
        <div>
          <input
            ref={e => { this.chatInput = e; }}
            type="text"
            placeholder="Message"
            onKeyPress={this.onChatKeyPress} />
        </div>
      </div>
    );
  }

  private onChatKeyPress = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const target = event.currentTarget;

    if (event.key === 'Enter') {
      event.preventDefault();

      const msg = target.value;
      this.props.sendMessage(msg);

      target.value = '';
    }
  }
}
