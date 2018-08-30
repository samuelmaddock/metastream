import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'

import { IAppState } from '../../reducers/index'
import { IUsersState, IUser, UserRole } from '../../lobby/reducers/users'
import { isHost } from '../../lobby/reducers/users.helpers'
import { getMaxUsers } from '../../lobby/reducers/session'
import { server_kickUser, server_toggleUserRole } from '../../lobby/actions/users'

import { MenuItem } from 'material-ui/Menu'
import { HighlightButton } from '../common/button'
import { ListOverlay } from './ListOverlay'
import { UserItem } from './UserItem'
import { t } from 'locale'

interface IProps {
  className?: string
  onInvite(): void
  openSessionSettings(): void
}

interface IConnectedProps {
  maxUsers?: number
  users: IUsersState
  isHost: boolean
}

interface IState {
  sortedUsers: IUser[]
}

type Props = IProps & IConnectedProps & DispatchProp<any>

class _UserList extends Component<Props> {
  state: IState = { sortedUsers: [] }

  private listOverlay: ListOverlay<IUser> | null = null

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

  componentWillMount() {
    this.updateUsers(this.props.users)
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.users !== nextProps.users) {
      this.updateUsers(nextProps.users)
    }
  }

  updateUsers(userState: IUsersState) {
    const users = Object.values(userState.map)
    users.sort((a, b) => {
      if (!a || !b) return 0

      if (a.pending && !b.pending) return -1
      if (!a.pending && b.pending) return 1

      return 0
    })
    this.setState({ sortedUsers: users })
  }

  render(): JSX.Element | null {
    return (
      <ListOverlay
        ref={e => (this.listOverlay = e)}
        className={this.props.className}
        title={t('users')}
        tagline={this.userSlots}
        action={this.renderActions()}
        renderMenuOptions={this.renderMenuOptions}
      >
        {this.state.sortedUsers.map(user => (
          <UserItem
            key={user.id}
            user={user}
            onClickMenu={e => this.listOverlay!.onSelect(e, user)}
          />
        ))}
      </ListOverlay>
    )
  }

  private renderActions() {
    return (
      <>
        <HighlightButton icon="mail" highlight={this.numUsers < 2} onClick={this.props.onInvite}>
          {t('invite')}
        </HighlightButton>
        {this.props.isHost && (
          <HighlightButton icon="settings" onClick={this.props.openSessionSettings} />
        )}
      </>
    )
  }

  private renderMenuOptions = (user: IUser, close: Function) => {
    const dispatch = this.props.dispatch!

    let items = [
      {
        label: 'Toggle DJ',
        onClick() {
          dispatch(server_toggleUserRole(user.id, UserRole.DJ))
        }
      },
      {
        label: 'Kick',
        onClick() {
          dispatch(server_kickUser(user.id))
        }
      }
    ]

    return (
      <>
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            onClick={() => {
              item.onClick()
              close()
            }}
            dense
          >
            {item.label}
          </MenuItem>
        ))}
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
