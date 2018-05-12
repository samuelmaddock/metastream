import React, { Component } from 'react'
import { IUser } from 'renderer/lobby/reducers/users'
import styles from './UserItem.css'
import { UserAvatar } from 'renderer/components/lobby/UserAvatar'
import { Icon } from '../Icon'

interface IProps {
  user: IUser
}

export class UserItem extends Component<IProps> {
  render(): JSX.Element | null {
    const { user } = this.props

    return (
      <figure className={styles.container}>
        <UserAvatar className={styles.avatar} id={this.props.user.id} avatar={user.avatar} />
        <figcaption className={styles.name} title={user.id}>
          {user.name}
        </figcaption>
        {user.admin && <Icon name="check-circle" className={styles.role} />}
      </figure>
    )
  }
}
