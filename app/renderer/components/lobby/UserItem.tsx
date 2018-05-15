import React, { Component } from 'react'
import { IUser } from 'renderer/lobby/reducers/users'
import styles from './UserItem.css'
import { UserAvatar } from 'renderer/components/lobby/UserAvatar'
import { Icon } from '../Icon'
import Tooltip from 'material-ui/Tooltip'
import Menu, { MenuItem } from 'material-ui/Menu'
import { IconButton } from '../common/button';
import { connect, DispatchProp } from 'react-redux';
import { IAppState } from '../../reducers/index';
import { server_kickUser } from '../../lobby/actions/users';
import { isAdmin } from '../../lobby/reducers/users.helpers';

interface IProps {
  user: IUser
}

interface IConnectedProps {
  admin: boolean
}

interface IState {
  anchorEl?: HTMLElement
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>

class _UserItem extends Component<PrivateProps, IState> {
  state: IState = {}

  render(): JSX.Element | null {
    const { user } = this.props

    return (
      <figure className={styles.container}>
        <UserAvatar className={styles.avatar} id={this.props.user.id} avatar={user.avatar} />
        <figcaption className={styles.name} title={user.id} onClick={this.handleClick}>
          {user.name}
        </figcaption>
        {this.props.admin && (
          <Tooltip title="Admin" placement="right">
            <Icon name="check-circle" className={styles.role} />
          </Tooltip>
        )}
        <IconButton icon="more-vertical" className={styles.menuBtn} onClick={this.handleClick} />
        {this.renderMenu()}
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
        <MenuItem onClick={this.handleClose}>Make DJ</MenuItem>
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

  private handleKick = () => {
    this.props.dispatch!(server_kickUser(this.props.user.id))
    this.handleClose()
  }
}

export const UserItem = connect<IConnectedProps, {}, IProps, IAppState>((state, props) => {
  return {
    admin: isAdmin(state, props.user.id)
  }
})(_UserItem)
