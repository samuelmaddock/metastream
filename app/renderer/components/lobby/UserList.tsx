import React, { Component } from 'react'
import { connect } from 'react-redux'

import { IAppState } from '../../reducers/index'
import { IUsersState } from '../../lobby/reducers/users'

import { HighlightButton } from '../common/button'
import { ListOverlay } from './ListOverlay'
import { UserItem } from './UserItem'

interface IProps {
  className?: string
  onInvite(): void
}

interface IConnectedProps {
  users: IUsersState
}

type Props = IProps & IConnectedProps

class _UserList extends Component<Props> {
  render(): JSX.Element | null {
    const { users } = this.props
    const userIds = Object.keys(users.map)
    return (
      <ListOverlay
        className={this.props.className}
        title="Users"
        tagline={`${userIds.length}`}
        action={
          <HighlightButton icon="mail" onClick={this.props.onInvite}>
            Invite
          </HighlightButton>
        }
      >
        {userIds.map((userId: string) => {
          const user = users.map[userId]!
          return <UserItem key={userId} user={user} />
        })}
      </ListOverlay>
    )
  }
}

export const UserList = connect((state: IAppState): IConnectedProps => {
  return {
    users: state.users
  }
})(_UserList) as React.ComponentClass<IProps>
