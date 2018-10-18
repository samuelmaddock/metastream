import React, { Component } from 'react'
import { IUser } from 'renderer/lobby/reducers/users'
import styles from './UserItem.css'
import { Icon } from '../Icon'
import Tooltip from 'material-ui/Tooltip'
import { IconButton } from '../common/button'
import { connect } from 'react-redux'
import { IAppState } from '../../reducers/index'
import { isAdmin, isDJ } from '../../lobby/reducers/users.helpers'
import { UserAvatar } from './UserAvatar'

interface IProps {
  name: string
  avatar?: string

  showMenu?: boolean
  onClickMenu?: React.MouseEventHandler<HTMLElement>

  requestApproval?: boolean
  onApprovalResponse?(approved: boolean): void

  admin?: boolean
  dj?: boolean
}

interface IState {
  anchorEl?: HTMLElement
}

export class UserItem extends Component<IProps, IState> {
  state: IState = {}

  render(): JSX.Element | null {
    const { onApprovalResponse } = this.props

    const roleIcon = this.props.admin
      ? { title: 'Admin', icon: 'check-circle' }
      : this.props.dj
        ? { title: 'DJ', icon: 'headphones' }
        : null

    let actionBtns: React.ReactNode

    if (this.props.requestApproval && onApprovalResponse) {
      actionBtns = (
        <>
          <IconButton
            icon="check"
            className={styles.allowBtn}
            title="Allow"
            onClick={() => onApprovalResponse(true)}
          />
          <IconButton
            icon="x"
            className={styles.disallowBtn}
            title="Disallow"
            onClick={() => onApprovalResponse(false)}
          />
        </>
      )
    } else if (this.props.showMenu) {
      actionBtns = (
        <IconButton
          icon="more-vertical"
          className={styles.menuBtn}
          onClick={this.props.onClickMenu}
        />
      )
    }

    return (
      <figure className={styles.container}>
        {this.props.avatar && <UserAvatar className={styles.avatar} avatar={this.props.avatar} />}
        <figcaption className={styles.name}>{this.props.name}</figcaption>
        {roleIcon && (
          <Tooltip title={roleIcon.title} placement="right">
            <Icon name={roleIcon.icon} className={styles.role} />
          </Tooltip>
        )}
        {actionBtns}
      </figure>
    )
  }
}

interface IConnectedProps {
  user?: IUser
}

export const ConnectedUserItem = connect<{}, {}, IProps & IConnectedProps, IAppState>(
  (state, props) => {
    return {
      admin: isAdmin(state, props.user!.id),
      dj: isDJ(state, props.user!.id)
    }
  }
)(UserItem)
