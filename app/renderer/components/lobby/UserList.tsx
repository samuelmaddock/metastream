import React, { Component } from 'react'
import { connect } from 'react-redux'

import { IAppState } from '../../reducers/index'
import { IUsersState } from '../../lobby/reducers/users'
import { isHost } from '../../lobby/reducers/users.helpers'
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
  private get userIds() {
    return Object.keys(this.props.users.map)
  }

  private get numUsers() {
    return this.userIds.length
  }

  private get userSlots() {
    const { numUsers } = this
    const { maxUsers } = this.props
    return `${numUsers}` + (maxUsers && isFinite(maxUsers) ? `/${maxUsers}` : '')
  }

  render(): JSX.Element | null {
    return (
      <ListOverlay
        className={this.props.className}
        title={t('users')}
        tagline={this.userSlots}
        action={this.renderActions()}
      >
        {this.userIds.map((userId: string) => {
          const user = this.props.users.map[userId]!
          return <UserItem key={userId} user={user} />
        })}
      </ListOverlay>
    )
  }

  renderActions() {
    return (
      <>
        {this.props.isHost && (
          <HighlightButton
            icon={(this.props.maxUsers || 0) > 1 ? 'users' : 'user'}
            onClick={this.props.onInvite}
          />
        )}
        <HighlightButton icon="mail" highlight={this.numUsers < 2} onClick={this.props.onInvite}>
          {t('invite')}
        </HighlightButton>
      </>
    )
  }
}

export const UserList = connect(
  (state: IAppState): IConnectedProps => {
    return {
      maxUsers: getMaxUsers(state),
      users: state.users,
      isHost: isHost(state)
    }
  }
)(_UserList) as React.ComponentClass<IProps>
