import React, { Component } from 'react'
import { IUser } from 'renderer/lobby/reducers/users'
import styles from './UserItem.css'
import { Icon } from '../Icon'
import Tooltip from 'material-ui/Tooltip'
import { IconButton } from '../common/button'
import { connect, DispatchProp } from 'react-redux'
import { IAppState } from '../../reducers/index'
import { isAdmin, isDJ } from '../../lobby/reducers/users.helpers'
import { localUserId } from '../../network'
import { server_answerClient } from '../../lobby/actions/user-init'

interface IProps {
  user: IUser
  onClickMenu: React.MouseEventHandler<HTMLElement>
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

    let actionBtns: React.ReactNode

    if (user.pending && this.props.isLocalAdmin) {
      const responseCreator = (allow: boolean) => () => {
        this.props.dispatch!(server_answerClient(user.id, allow))
      }

      actionBtns = (
        <>
          <IconButton icon="check" className={styles.allowBtn} title="Allow" onClick={responseCreator(true)} />
          <IconButton icon="x" className={styles.disallowBtn} title="Disallow" onClick={responseCreator(false)} />
        </>
      )
    } else if (this.canShowMenu) {
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
        {/* <UserAvatar className={styles.avatar} id={this.props.user.id} avatar={user.avatar} /> */}
        <figcaption className={styles.name} title={user.id}>
          {user.name}
        </figcaption>
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

export const UserItem = connect<IConnectedProps, {}, IProps, IAppState>((state, props) => {
  return {
    isLocalAdmin: isAdmin(state),
    admin: isAdmin(state, props.user.id),
    dj: isDJ(state, props.user.id)
  }
})(_UserItem)
