import React, { Component } from 'react'
import styles from './Disconnect.css'
import { TitleBar } from '../TitleBar'
import { MenuButton } from '../menu/MenuButton'
import { Link } from 'react-router-dom'
import { Icon } from '../Icon'
import { t } from 'locale/index'
import { NetworkDisconnectReason, NetworkDisconnectMessages } from 'constants/network'
import { ExternalLink } from '../common/link'

interface IProps {
  reason: NetworkDisconnectReason
}

export class Disconnect extends Component<IProps> {
  render(): JSX.Element {
    const { reason } = this.props
    const reasonKey: any = NetworkDisconnectMessages[reason]
    const msg = t(reasonKey) || reasonKey

    return (
      <div className={styles.container}>
        <TitleBar className={styles.titlebar} />

        <h1 className={styles.header}>Disconnected</h1>
        <p className={styles.info}>
          <Icon name="info" />
          {msg}
        </p>
        <Link to="/">
          <MenuButton size="medium">{t('ok')}</MenuButton>
        </Link>
      </div>
    )
  }
}
