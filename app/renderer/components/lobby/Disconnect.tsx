import React, { Component } from 'react'
import styles from './Disconnect.css'
import { TitleBar } from '../TitleBar'
import { MenuButton } from '../menu/MenuButton'
import { Link } from 'react-router-dom'
import { Icon } from '../Icon'
import { NetworkDisconnectReason, NetworkDisconnectMessages } from 'constants/network'
import { ExternalLink } from '../common/link'
import { Trans, withNamespaces, WithNamespaces } from 'react-i18next'

interface IProps extends WithNamespaces {
  reason: NetworkDisconnectReason
}

class _Disconnect extends Component<IProps> {
  render(): JSX.Element {
    const { t, reason } = this.props
    const reasonKey: any = NetworkDisconnectMessages[reason]
    const msg = t(reasonKey) || reasonKey

    // prettier-ignore
    return (
      <div className={styles.container}>
        <TitleBar className={styles.titlebar} />

        <h1 className={styles.header}>{t('disconnected')}</h1>
        <p className={styles.info}>
          <Icon name="info" />
          <span>
            {msg}
            {reason === NetworkDisconnectReason.Timeout && <>&nbsp;</>}
            {reason === NetworkDisconnectReason.Timeout && (
              <Trans i18nKey="networkTroubleshootingHelp">
                See <ExternalLink href="https://github.com/samuelmaddock/metastream/wiki/Network-Troubleshooting">Network Troubleshooting guide</ExternalLink> for help.
              </Trans>
            )}
          </span>
        </p>
        <Link to="/">
          <MenuButton size="medium">{t('ok')}</MenuButton>
        </Link>
      </div>
    )
  }
}

export const Disconnect = withNamespaces()(_Disconnect)
