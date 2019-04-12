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
        {FEATURE_DISCORD_INVITE && this.renderDiscord()}
        {this.renderFriendCode()}
        {this.props.isHost && this.renderDirectIP()}
      </div>
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

  private renderDiscord() {
    const { t } = this.props
    let message

    if (this.props.discordPresenceEnabled) {
      const href =
        'https://support.discordapp.com/hc/en-us/articles/115001557452-Game-Invites-and-Detailed-Status-Rich-Presence-'

      // prettier-ignore
      message = 0 ? (
        <Trans i18nKey="sendDiscordInvite">
          <ExternalLink href={href} className="link">Send Discord invites</ExternalLink> to share friend codes automatically.
        </Trans>
      ) : (
        t('launchDiscordInvite', { productName: PRODUCT_NAME })
      )
    } else {
      // prettier-ignore
      message = (
        <Trans i18nKey="enableDiscordInvite">
          Enable <em>Discord Rich Presence</em> from the settings menu to allow Discord invites.
        </Trans>
      )
    }

    return (
      <section className={styles.method}>
        <h2 className={styles.header}>
          <ExternalLink href="https://discordapp.com/">
            <img src={assetUrl('icons/social/discord-color.svg')} className={styles.discordLogo} />
          </ExternalLink>
        </h2>
        <p>{message}</p>
      </section>
    )
  }

  private renderDirectIP() {
    const { t } = this.props
    const portHref = 'https://www.wikihow.com/Set-Up-Port-Forwarding-on-a-Router'
    const port = `TCP ${WEBSOCKET_PORT_DEFAULT}`

    // prettier-ignore
    return (
      <section className={styles.method}>
        <h2 className={styles.header}>{t('directIP')}</h2>
        <p>
          <Trans i18nKey="sharePublicIP">
            Share <ExternalLink href="https://www.google.com/search?q=ip" className="link">your public IP address</ExternalLink> to allow friends to connect directly.
          </Trans>
          <br />
          <em>
            <Trans i18nKey="requiresPortForward" data-port={port}>
              Requires <ExternalLink href={portHref} className="link">setting up port forwarding</ExternalLink> of <strong>{{port}}</strong> to accept direct connections.
            </Trans>
          </em>
        </p>
      </section>
    )
  }
}

export default withNamespaces()(connect(mapStateToProps)(Invite))
