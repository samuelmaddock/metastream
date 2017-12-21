import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './ServerBrowser.css';
import { NetworkState } from 'types/network';
import { ILobbySession } from 'renderer/platform/types';
import LayoutMain from 'renderer/components/layout/Main';
import { Icon } from 'renderer/components/Icon';
import { MenuButton } from 'renderer/components/menu/MenuButton';

interface IProps {
  network: NetworkState;
  refresh: () => void;
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
              <MenuButton icon="refresh-cw" size="medium" onClick={this.props.refresh}>
                Refresh
              </MenuButton>
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
      case NetworkState.Loading:
        return <div>Loading...</div>;
    }

    if (!list || list.length === 0) {
      return <div>No sessions found</div>;
    }

    const lobbies = list.map(result => {
      return (
        <tr key={result.id}>
          <td>
            <Link to={`/lobby/${result.id}`}>
              {result.name} ({result.id})
            </Link>
          </td>
          <td>1/4</td>
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
}
