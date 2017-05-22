import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './ServerBrowser.css';
import { NetworkState } from "types/network";
import { ILobbyRequestResult } from "actions/steamworks";

interface IProps {
  name: string;
}

export class Lobby extends Component<IProps,void> {
  render(): JSX.Element | null {
    const { name } = this.props;
    return (
      <div className={styles.container} data-tid="container">
        <Link to="/">Go back</Link>
        <h1>Lobby: {name}</h1>
      </div>
    );
  }
}
