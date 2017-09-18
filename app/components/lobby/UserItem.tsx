import React, { Component } from 'react';
import { IUser } from 'lobby/reducers/users';
import styles from './UserItem.css';

interface IProps {
  user: IUser;
}

export class UserItem extends Component<IProps> {
  render(): JSX.Element | null {
    const { user } = this.props;

    return (
      <figure className={styles.container}>
        <div className={styles.avatar} />
        <figcaption className={styles.name} title={user.id}>
          {user.name}
        </figcaption>
      </figure>
    );
  }
}
