import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './ServerBrowser.css';
import { NetworkState } from "types/network";
import { ILobbyRequestResult } from "actions/steamworks";

interface IProps {
  name: string;
  sendMessage(msg: string): void;
}

export class Lobby extends Component<IProps,void> {
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
    return (
      <div>
        <ul>
          <li>
            <b>Name:</b> message
          </li>
        </ul>
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
