import React, { Component } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import styles from './Invite.css'
import { IAppState } from 'reducers'
import { ClipboardTextInput } from 'components/common/input'
import { isHost } from 'lobby/reducers/users.helpers'

import { ExternalLink } from 'components/common/link'
import { WEBSOCKET_PORT_DEFAULT } from 'constants/network'
import { IReactReduxProps } from 'types/redux-thunk'
import { assetUrl } from 'utils/appUrl'
import { PRODUCT_NAME } from 'constants/app'
import { withNamespaces, WithNamespaces, Trans } from 'react-i18next'
import SessionSettings from './SessionSettings'
import { LobbyModalProps } from './types'

import { t } from 'locale'

interface IProps extends LobbyModalProps {
  className?: string
  onClose?: () => void
}

class Invite extends Component<IProps> {
  render(): JSX.Element {
    return (
      <div className={cx(styles.container, this.props.className)}>
        {this.renderURL()}
        {this.props.isHost && <SessionSettings />}
      </div>
    )
  }

  private renderURL() {
    return (
      <section className={styles.method}>
        <p>{t('shareSessionUrl')}</p>
        <ClipboardTextInput
          className={styles.idContainer}
          inputClassName={styles.idText}
          defaultValue={location.href}
          disabled
        />
      </section>
    )
  }
}

export default Invite
