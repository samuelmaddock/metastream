import React, { Component } from 'react'
import styles from './Disconnect.css'
import { TitleBar } from '../TitleBar'
import { MenuButton } from '../menu/MenuButton'
import { Icon } from '../Icon'
import { NetworkDisconnectReason, NetworkDisconnectMessages } from 'constants/network'
import { ExternalLink } from '../common/link'
import { Trans, withNamespaces, WithNamespaces } from 'react-i18next'
import { UpdateService } from 'services/updater'

interface IProps extends WithNamespaces {
  reason: NetworkDisconnectReason
  reconnect: () => void
}

class _Disconnect extends Component<IProps> {
  componentDidMount() {
    if (this.props.reason === NetworkDisconnectReason.VersionMismatch) {
      UpdateService.getInstance().checkForUpdate()
    }
  }

  render(): JSX.Element {
    const { t, reason, reconnect } = this.props
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
            {reason === NetworkDisconnectReason.Error && <>&nbsp;</>}
            {reason === NetworkDisconnectReason.Error && (
              <Trans i18nKey="networkTroubleshootingHelp">
                See <ExternalLink href="https://github.com/samuelmaddock/metastream/wiki/Network-Troubleshooting">Network Troubleshooting guide</ExternalLink> for help.
              </Trans>
            )}
          </span>
        </p>
        <div className={styles.buttonrow}>
          <MenuButton to="/" size="medium">{t('ok')}</MenuButton>
          <MenuButton size="medium" onClick={reconnect}>{t('retry')}</MenuButton>
        </div>
      </div>
    )
  }
}

export const Disconnect = withNamespaces()(_Disconnect)
