import React, { Component } from 'react'
import { connect } from 'react-redux'

import { IAppState } from '../../reducers/index'
import { IUsersState, isHost } from '../../lobby/reducers/users'
import { getMaxUsers } from '../../lobby/reducers/session'

import { HighlightButton } from '../common/button'
import { ListOverlay } from './ListOverlay'
import { UserItem } from './UserItem'
import { t } from '../../../locale/index'

interface IProps {
  className?: string
  onInvite(): void
}

interface IConnectedProps {
  maxUsers?: number
  users: IUsersState
  isHost: boolean
}

type Props = IProps & IConnectedProps

class _UserList extends Component<Props> {
  render(): JSX.Element | null {
    const { users, maxUsers } = this.props
    const userIds = Object.keys(users.map)

    const numUsers = userIds.length
    const userSlots = `${numUsers}` + (maxUsers && isFinite(maxUsers) ? `/${maxUsers}` : '')

    return (
      <ListOverlay
        className={this.props.className}
        title={t('users')}
        tagline={userSlots}
        action={
          <HighlightButton icon="mail" highlight={numUsers < 2} onClick={this.props.onInvite}>
            {t('invite')}
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
    maxUsers: getMaxUsers(state),
    users: state.users,
    isHost: isHost(state)
  }
})(_UserList) as React.ComponentClass<IProps>
