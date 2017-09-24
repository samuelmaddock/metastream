import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './ServerBrowser.css';
import { NetworkState } from 'types/network';
import { ILobbySession } from 'platform/types';
import LayoutMain from 'components/layout/Main';
import { Icon } from 'components/Icon';

interface IProps {
  network: NetworkState;
  refresh: Function;
  list?: ILobbySession[];
}

export class ServerBrowser extends Component<IProps, {}> {
  render(): JSX.Element | null {
    return (
      <LayoutMain className={styles.container}>
        <Link to="/" className={styles.goBack}>
          <Icon name="arrow-left" />
          Go back
        </Link>
        <section>
          <header className={styles.header}>
            <div className={styles.left}>
              <h1>Sessions</h1>
            </div>
            <div className={styles.right}>
              {/* <Link to="/lobby/create" className={styles.headerBtn}>
                Create lobby
              </Link> */}
            </div>
          </header>
          {this.renderList()}
        </section>
      </LayoutMain>
    );
  }

  private renderList(): React.ReactNode {
    const { network, list } = this.props;

    switch (network) {
      case NetworkState.Uninitialized:
        return <div>{this.renderRefresh()}</div>;
      case NetworkState.Loading:
        return <div>Loading...</div>;
    }

    const lobbies = list!.map(result => {
      return (
        <tr key={result.id}>
          <td>
            <Link to={`/lobby/${result.id}`}>
              {result.name} ({result.id})
            </Link>
          </td>
          <td>0/4</td>
        </tr>
      );
    });

    return (
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Users</th>
          </tr>
        </thead>
        <tbody>{lobbies}</tbody>
      </table>
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
