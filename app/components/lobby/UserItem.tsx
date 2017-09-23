import React, { Component } from 'react';
import { IUser } from 'lobby/reducers/users';
import styles from './UserItem.css';
import { UserAvatar } from 'components/lobby/UserAvatar';

interface IProps {
  user: IUser;
}

export class UserItem extends Component<IProps> {
  render(): JSX.Element | null {
    const { user } = this.props;

    return (
      <figure className={styles.container}>
        <UserAvatar className={styles.avatar} id={this.props.user.id} />
        <figcaption className={styles.name} title={user.id}>
          {user.name}
        </figcaption>
      </figure>
    );
  }
}
