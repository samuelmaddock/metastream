import React, { Component } from 'react'
import { connect } from 'react-redux'

import { IAppState } from '../../reducers/index'
import { IUsersState, IUser, UserRole, IUserInvite } from '../../lobby/reducers/users'
import { isHost, isAdmin } from '../../lobby/reducers/users.helpers'
import { getMaxUsers } from '../../lobby/reducers/session'
import { server_kickUser, server_toggleUserRole, answerUserInvite } from '../../lobby/actions/users'

import { MenuItem } from 'material-ui/Menu'
import { HighlightButton } from '../common/button'
import { ListOverlay } from './ListOverlay'
import { UserItem, ConnectedUserItem } from './UserItem'
import { IReactReduxProps } from 'types/redux-thunk'
import { server_answerClient } from '../../lobby/actions/user-init'
import { localUserId } from '../../network/index'
import { assetUrl } from 'utils/appUrl'
import { SessionMode } from 'renderer/reducers/settings'
import { compose } from 'redux'
import { withNamespaces, WithNamespaces } from 'react-i18next'

interface IProps {
  className?: string
  onInvite(): void
  openSessionSettings(): void
}

interface IConnectedProps {
  maxUsers?: number
  users: IUsersState
  isHost: boolean
  isAdmin: boolean
  sessionMode: SessionMode
}

interface IState {
  sortedUsers: IUser[]
}

type Props = IProps & IConnectedProps & IReactReduxProps & WithNamespaces

class _UserList extends Component<Props> {
  state: IState = { sortedUsers: [] }

  private listOverlay: ListOverlay<IUser> | null = null

  private get numUsers() {
    return this.state.sortedUsers.length
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
    const users = Object.values(userState.map).filter(user =>
      user ? !user.pending || this.props.isHost : false
    )
    users.sort((a, b) => {
      if (!a || !b) return 0

      if (a.pending && !b.pending) return -1
      if (!a.pending && b.pending) return 1

      return 0
    })
    this.setState({ sortedUsers: users })
  }

  render(): JSX.Element | null {
    const { t } = this.props
    return (
      <ListOverlay
        ref={(e: any) => (this.listOverlay = e)}
        className={this.props.className}
        title={t('users')}
        tagline={this.userSlots}
        action={this.renderActions()}
        renderMenuOptions={this.renderMenuOptions}
      >
        {this.props.users.invites.map(this.renderInvite)}
        {this.state.sortedUsers.map(this.renderUser)}
      </ListOverlay>
    )
  }

  private renderInvite = (invite: IUserInvite) => {
    return (
      <UserItem
        key={invite.id}
        name={invite.name}
        avatar={invite.avatar}
        avatarBadge={assetUrl(`icons/badge/${invite.type}.svg`)}
        requestApproval
        onApprovalResponse={(approved: boolean) => {
          this.props.dispatch!(
            answerUserInvite({
              ...invite,
              response: approved ? 'YES' : 'NO'
            })
          )
        }}
      />
    )
  }

  private renderUser = (user: IUser) => {
    const requestApproval = user.pending && this.props.isAdmin

    return (
      <ConnectedUserItem
        key={user.id}
        user={user}
        name={user.name}
        avatar={user.avatar}
        showMenu={this.props.isAdmin && user.id !== localUserId()}
        onClickMenu={e => this.listOverlay!.onSelect(e, user)}
        requestApproval={requestApproval}
        onApprovalResponse={
          requestApproval
            ? (approved: boolean) => {
                this.props.dispatch!(server_answerClient(user.id, approved))
              }
            : undefined
        }
      />
    )
  }

  private renderActions() {
    const { t } = this.props
    return (
      <>
        {this.props.sessionMode !== SessionMode.Offline && (
          <HighlightButton icon="mail" highlight={this.numUsers < 2} onClick={this.props.onInvite}>
            {t('invite')}
          </HighlightButton>
        )}
        {this.props.isHost && (
          <HighlightButton icon="settings" onClick={this.props.openSessionSettings} />
        )}
      </>
    )
  }

  private renderMenuOptions = (user: IUser, close: Function) => {
    const { t, dispatch } = this.props

    let items = [
      {
        label: t('toggleDJ'),
        onClick() {
          dispatch(server_toggleUserRole(user.id, UserRole.DJ))
        }
      },
      {
        label: t('kick'),
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

export const UserList = withNamespaces()(
  connect(
    (state: IAppState): IConnectedProps => {
      return {
        maxUsers: getMaxUsers(state),
        users: state.users,
        isAdmin: isAdmin(state),
        isHost: isHost(state),
        sessionMode: state.settings.sessionMode
      }
    }
  )(_UserList)
)
