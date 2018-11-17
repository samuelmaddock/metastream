import React, { Component } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import styles from './Invite.css'
import { IAppState } from 'renderer/reducers'
import { ClipboardTextInput } from 'renderer/components/common/input'
import { getHostId, isHost, getHost } from 'renderer/lobby/reducers/users.helpers'

import { ExternalLink } from 'renderer/components/common/link'
import { WEBSOCKET_PORT_DEFAULT } from 'constants/network'
import { IReactReduxProps } from 'types/redux-thunk'
import { assetUrl } from 'utils/appUrl'
import { isDiscordAvailable } from 'renderer/vendor/discord'
import { PRODUCT_NAME } from 'constants/app'

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

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

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
    const message = this.props.isHost
      ? 'Share your friend code below to invite friends.'
      : `Send ${this.props.hostName}’s friend code to invite friends.`

    return (
      <section className={styles.method}>
        <h2 className={styles.header}>Friend Code</h2>
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
    let message

    if (this.props.discordPresenceEnabled) {
      const href =
        'https://support.discordapp.com/hc/en-us/articles/115001557452-Game-Invites-and-Detailed-Status-Rich-Presence-'

      message = isDiscordAvailable() ? (
        <>
          <ExternalLink href={href} className="link">
            Send Discord invites
          </ExternalLink>
          &nbsp;to share your friend code automatically.
        </>
      ) : (
        `Launch Discord and restart ${PRODUCT_NAME} to use Discord invites.`
      )
    } else {
      message = (
        <>
          Enable <em>Discord Rich Presence</em> from the settings menu to allow Discord invites.
        </>
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
    return (
      <section className={styles.method}>
        <h2 className={styles.header}>Direct IP</h2>
        <p>
          Share&nbsp;
          <ExternalLink href="https://www.google.com/search?q=ip" className="link">
            your public IP address
          </ExternalLink>
          &nbsp;to allow friends to connect directly.
          <br />
          <em>
            Requires&nbsp;
            <ExternalLink
              href="https://www.wikihow.com/Set-Up-Port-Forwarding-on-a-Router"
              className="link"
            >
              setting up port forwarding
            </ExternalLink>
            &nbsp;of <strong>TCP {WEBSOCKET_PORT_DEFAULT}</strong> to accept direct connections.
          </em>
        </p>
      </section>
    )
  }
}

export default connect(mapStateToProps)(Invite)
