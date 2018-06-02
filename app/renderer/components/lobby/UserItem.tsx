import React, { Component } from 'react'
import { IUser, UserRole } from 'renderer/lobby/reducers/users'
import styles from './UserItem.css'
import { UserAvatar } from 'renderer/components/lobby/UserAvatar'
import { Icon } from '../Icon'
import Tooltip from 'material-ui/Tooltip'
import Menu, { MenuItem } from 'material-ui/Menu'
import { IconButton } from '../common/button'
import { connect, DispatchProp } from 'react-redux'
import { IAppState } from '../../reducers/index'
import { server_kickUser, server_toggleUserRole } from '../../lobby/actions/users'
import { isAdmin, isDJ } from '../../lobby/reducers/users.helpers'
import { localUserId } from '../../network'

interface IProps {
  user: IUser
}

interface IConnectedProps {
  isLocalAdmin: boolean
  admin: boolean
  dj: boolean
}

interface IState {
  anchorEl?: HTMLElement
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>

class _UserItem extends Component<PrivateProps, IState> {
  state: IState = {}

  private get canShowMenu() {
    return this.props.isLocalAdmin && this.props.user.id !== localUserId()
  }

  render(): JSX.Element | null {
    const { user } = this.props

    const roleIcon = this.props.admin
      ? { title: 'Admin', icon: 'check-circle' }
      : this.props.dj
        ? { title: 'DJ', icon: 'headphones' }
        : null

    return (
      <figure className={styles.container}>
        {/* <UserAvatar className={styles.avatar} id={this.props.user.id} avatar={user.avatar} /> */}
        <figcaption className={styles.name} title={user.id} onClick={this.handleClick}>
          {user.name}
        </figcaption>
        {roleIcon && (
          <Tooltip title={roleIcon.title} placement="right">
            <Icon name={roleIcon.icon} className={styles.role} />
          </Tooltip>
        )}
        {this.canShowMenu && (
          <IconButton icon="more-vertical" className={styles.menuBtn} onClick={this.handleClick} />
        )}
        {this.canShowMenu && this.renderMenu()}
      </figure>
    )
  }

  private renderMenu() {
    const { anchorEl } = this.state
    return (
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={this.handleClose}
      >
        <MenuItem onClick={this.handleToggleRole.bind(null, UserRole.DJ)}>
          {this.props.dj ? 'Remove DJ' : 'Make DJ'}
        </MenuItem>
        <MenuItem onClick={this.handleKick}>Kick</MenuItem>
      </Menu>
    )
  }

  private handleClick = (event: React.MouseEvent<HTMLElement>) => {
    this.setState({ anchorEl: event.target as HTMLElement })
  }

  private handleClose = () => {
    this.setState({ anchorEl: undefined })
  }

  private handleToggleRole = (role: UserRole) => {
    this.props.dispatch!(server_toggleUserRole(this.props.user.id, role))
    this.handleClose()
  }

  private handleKick = () => {
    this.props.dispatch!(server_kickUser(this.props.user.id))
    this.handleClose()
  }
}

export const UserItem = connect<IConnectedProps, {}, IProps, IAppState>((state, props) => {
  return {
    isLocalAdmin: isAdmin(state),
    admin: isAdmin(state, props.user.id),
    dj: isDJ(state, props.user.id)
  }
})(_UserItem)
