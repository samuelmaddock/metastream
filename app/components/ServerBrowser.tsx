import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './ServerBrowser.css';
import { NetworkState } from "types/network";
import { ILobbyRequestResult } from "actions/steamworks";

interface IProps {
  network: NetworkState;
  refresh: Function;
  list?: ILobbyRequestResult[];
}

export class ServerBrowser extends Component<IProps,{}> {
  render(): JSX.Element | null {
    return (
      <div className={styles.container} data-tid="container">
        <h1>Lobbies:</h1>
        {this.renderList()}
      </div>
    );
  }

  private renderList(): React.ReactNode {
    const { network, list } = this.props;

    switch (network) {
      case NetworkState.Uninitialized:
        return <div>{this.renderRefresh()}</div>;
      case NetworkState.Loading:
        return <div>Loading...</div>;
      default:
    }

    const lobbies = list!.map((result) => {
      return (
        <li key={result.steamId}>
          {result.steamId}
        </li>
      )
    });

    return (
      <ul>{lobbies}</ul>
    );
  }

  private renderRefresh(): JSX.Element {
    return (
      <button type="button" onClick={() => this.props.refresh}>
        Refresh
      </button>
    );
  }
}
