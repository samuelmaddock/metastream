import React, { Component } from 'react'
import { DispatchProp, connect } from 'react-redux'
import cx from 'classnames'

import styles from './Invite.css'
import { IAppState } from 'renderer/reducers'
import { getHostId, isHost, getHost } from 'renderer/lobby/reducers/users.helpers'
import { USERS_MAX } from 'constants/settings'

interface IProps {
  className?: string
  onClose?: () => void
}

interface IState {
  dismissed?: boolean
}

interface IConnectedProps {
  isHost: boolean
  hostId: string
  hostName: string
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>

class SessionSettings extends Component<PrivateProps, IState> {
  render(): JSX.Element {
    return (
      <div className={cx(styles.container, this.props.className)}>
        <div>TODO: toggle solo session</div>
        <select>{this.renderUserOpts()}</select>
      </div>
    )
  }

  private renderUserOpts() {
    const userOpts = []

    for (let i = 2; i <= USERS_MAX; i = i << 1) {
      userOpts.push(i)
    }

    const elems = userOpts.map(numUsers => {
      return <option value={numUsers}>{numUsers} users</option>
    })

    return (
      <>
        <option value={1}>Solo</option>
        {elems}
        <option value={Infinity}>Unlimited users (EXPERIMENTAL)</option>
      </>
    )
  }
}

export default connect(
  (state: IAppState): IConnectedProps => {
    return {
      isHost: isHost(state),
      hostId: getHostId(state),
      hostName: getHost(state).name
    }
  }
)(SessionSettings) as React.ComponentClass<IProps>
