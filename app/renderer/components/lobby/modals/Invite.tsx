import React, { Component } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import styles from './Invite.css'
import { IAppState } from 'renderer/reducers'
import { ClipboardTextInput } from 'renderer/components/common/input'
import { getHostId, isHost, getHost } from 'renderer/lobby/reducers/users.helpers'

import { ExternalLink } from 'renderer/components/common/link'
import { WEBSOCKET_PORT_DEFAULT } from 'constants/network'
import { Icon } from '../../Icon'
import Tooltip from 'material-ui/Tooltip'
import { IReactReduxProps } from 'types/redux-thunk'

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

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

class Invite extends Component<PrivateProps> {
  render(): JSX.Element {
    const msg = this.props.isHost
      ? 'Invite friends using your friend code below.'
      : `Send ${this.props.hostName}’s friend code to invite friends.`

    return (
      <div className={cx(styles.container, this.props.className)}>
        <p>{msg}</p>
        <ClipboardTextInput
          className={styles.idContainer}
          inputClassName={styles.idText}
          defaultValue={this.props.hostId}
          disabled
        />
        {this.props.isHost && this.renderDirectIP()}
      </div>
    )
  }

  private renderDirectIP() {
    const href = 'https://portforward.com/'
    return (
      <p className={styles.directIp}>
        {`Open port TCP ${WEBSOCKET_PORT_DEFAULT} to allow direct connections.`}
        <ExternalLink href={href}>
          <Tooltip title={href}>
            <Icon name="info" />
          </Tooltip>
        </ExternalLink>
      </p>
    )
  }
}

export default connect(mapStateToProps)(Invite) as React.ComponentClass<IProps>
