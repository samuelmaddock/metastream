import React, { Component } from 'react'
import { DispatchProp, connect } from 'react-redux'
import cx from 'classnames'

import styles from './Invite.css'
import { IAppState } from 'renderer/reducers'
import { ClipboardTextInput } from 'renderer/components/common/input'
import { getHostId, isHost, getHost } from 'renderer/lobby/reducers/users'

interface IProps {
  className?: string
  onClose?: () => void
}

interface IConnectedProps {
  isHost: boolean
  hostId: string
  hostName: string
}

const mapStateToProps = (state: IAppState): IConnectedProps => {
  return {
    isHost: isHost(state),
    hostId: getHostId(state),
    hostName: getHost(state).name
  }
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>

class _Invite extends Component<PrivateProps> {
  render(): JSX.Element {
    const msg = this.props.isHost
      ? 'Send your friend code to peeps to invite them'
      : `Send ${this.props.hostName}’s friend code to peeps to invite them`
    return (
      <div className={cx(styles.container, this.props.className)}>
        <p>{msg}</p>
        <ClipboardTextInput
          className={styles.idContainer}
          inputClassName={styles.idText}
          defaultValue={this.props.hostId}
          disabled
        />
      </div>
    )
  }
}

export const Invite = connect(mapStateToProps)(_Invite) as React.ComponentClass<IProps>
