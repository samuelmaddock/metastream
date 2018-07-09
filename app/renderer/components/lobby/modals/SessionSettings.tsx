import React, { Component } from 'react'
import { DispatchProp, connect } from 'react-redux'
import cx from 'classnames'

import styles from './SessionSettings.css'
import { IAppState } from 'renderer/reducers'
import { getHostId, isHost, getHost } from 'renderer/lobby/reducers/users.helpers'
import { USERS_MAX } from 'constants/settings'
import { t } from 'locale'
import { SwitchOption } from '../../settings/controls'
import { HighlightButton } from '../../common/button'
import { ISettingsState, SessionMode } from '../../../reducers/settings'
import { setSetting } from '../../../actions/settings'

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
  settings: ISettingsState
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>

class SessionSettings extends Component<PrivateProps, IState> {
  render(): JSX.Element {
    /*
    TODO:
    - public/private
    - num users
    - password?
    - allow chat
    - Allow Direct IP [on/off]
    - Allow P2P [on/off]
    - ban management
    */
    return (
      <div className={cx(styles.container, this.props.className)}>
        {/* <select>{this.renderUserOpts()}</select> */}
        {this.renderSessionMode()}
      </div>
    )
  }

  private renderSessionMode() {
    const modes = [
      { mode: SessionMode.Public, label: 'Public', icon: 'users' },
      { mode: SessionMode.Private, label: 'Private', icon: 'user' }
    ]
    const dispatch = this.props.dispatch!
    const { sessionMode } = this.props.settings
    return (
      <div className={styles.sessionMode}>
        {modes.map(mode => (
          <HighlightButton
            key={mode.label}
            icon={mode.icon}
            size="large"
            highlight={sessionMode === mode.mode}
            onClick={() => dispatch(setSetting('sessionMode', mode.mode))}
          >
            {mode.label}
          </HighlightButton>
        ))}
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
      hostName: getHost(state).name,
      settings: state.settings
    }
  }
)(SessionSettings) as React.ComponentClass<IProps>
