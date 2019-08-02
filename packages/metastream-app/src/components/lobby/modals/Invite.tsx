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
import SessionSettings from './SessionSettings'

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

type PrivateProps = IProps & IConnectedProps & IReactReduxProps & WithNamespaces

class Invite extends Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <div className={cx(styles.container, this.props.className)}>
        {this.renderURL()}
        <SessionSettings />
      </div>
    )
  }

  private renderURL() {
    const { t } = this.props

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

export default withNamespaces()(connect(mapStateToProps)(Invite))
