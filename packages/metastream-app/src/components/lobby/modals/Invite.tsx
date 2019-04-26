import React, { Component } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import styles from './Invite.css'
import { IAppState } from 'reducers'
import { ClipboardTextInput } from 'components/common/input'
import { getHostId, isHost, getHost } from 'lobby/reducers/users.helpers'

import { ExternalLink } from 'components/common/link'
import { WEBSOCKET_PORT_DEFAULT } from 'constants/network'
import { IReactReduxProps } from 'types/redux-thunk'
import { assetUrl } from 'utils/appUrl'
import { PRODUCT_NAME } from 'constants/app'
import { withNamespaces, WithNamespaces, Trans } from 'react-i18next'

interface IProps {
  className?: string
  onClose?: () => void
}

interface IConnectedProps {
  isHost: boolean
  hostId: string
  hostName: string
  discordPresenceEnabled: boolean
}

const mapStateToProps = (state: IAppState): IConnectedProps => {
  return {
    isHost: isHost(state),
    hostId: getHostId(state),
    hostName: getHost(state).name,
    discordPresenceEnabled: state.settings.discordPresence
  }
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps & WithNamespaces

class Invite extends Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <div className={cx(styles.container, this.props.className)}>
        {this.renderURL()}
        {/* {this.renderFriendCode()} */}
      </div>
    )
  }

  private renderURL() {
    const { t } = this.props

    return (
      <section className={styles.method}>
        <p>Share the URL below to invite friends.</p>
        <ClipboardTextInput
          className={styles.idContainer}
          inputClassName={styles.idText}
          defaultValue={location.href}
          disabled
        />
      </section>
    )
  }

  private renderFriendCode() {
    const { t } = this.props
    const message = this.props.isHost
      ? t('shareFriendCode')
      : t('shareFriendCodeOther', { name: this.props.hostName })

    return (
      <section className={styles.method}>
        <h2 className={styles.header}>{t('friendCode')}</h2>
        <p>{message}</p>
        <ClipboardTextInput
          className={styles.idContainer}
          inputClassName={styles.idText}
          defaultValue={this.props.hostId}
          disabled
        />
      </section>
    )
  }
}

export default withNamespaces()(connect(mapStateToProps)(Invite))
