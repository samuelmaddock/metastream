import React, { Component } from 'react'
import { DispatchProp, connect } from 'react-redux'
import cx from 'classnames'

import styles from './Invite.css'
import { IAppState } from 'renderer/reducers'
import { ClipboardTextInput } from 'renderer/components/common/input'
import { getHostId, isHost, getHost } from 'renderer/lobby/reducers/users.helpers'

// license notice
import packageJson from 'package.json'
import { USERS_MAX_FREE } from 'constants/settings'
import { LICENSE_PURCHASE_URL } from 'constants/license'
import { hasValidLicense } from 'renderer/license'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { ExternalLink } from 'renderer/components/common/link'
import { HighlightButton } from 'renderer/components/common/button'
import { IconButton } from 'renderer/components/common/button'
import { t } from '../../../../locale/index'

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
}

const mapStateToProps = (state: IAppState): IConnectedProps => {
  return {
    isHost: isHost(state),
    hostId: getHostId(state),
    hostName: getHost(state).name
  }
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>

class Invite extends Component<PrivateProps, IState> {
  state: IState = {
    dismissed: hasValidLicense() || sessionStorage.getItem('inviteNoticeDismissed') === '1'
  }

  render(): JSX.Element {
    const msg = this.props.isHost
      ? // ? 'Send your friend code to people to invite them.'
        'Invite friends using your friend code below.'
      : `Send ${this.props.hostName}’s friend code to invite friends.`

    const notice = !this.state.dismissed ? (
      <div className={styles.notice}>
        <IconButton
          icon="x"
          className={styles.noticeDismiss}
          onClick={() => {
            sessionStorage.setItem('inviteNoticeDismissed', '1')
            this.setState({ dismissed: true })
          }}
        />
        <p>Hello! Thanks for trying out {packageJson.productName}.</p>
        <p>
          This is an unregistered evaluation version, and although the trial is untimed, a license
          must be purchased for continued use.
        </p>
        <p>
          Additionally, the evaluation version is{' '}
          <em>limited to hosting {USERS_MAX_FREE} users in a session</em>.
        </p>
        <p>Would you like to purchase a license now?</p>
        <ExternalLink href={`${LICENSE_PURCHASE_URL}&utm_source=invite`}>
          <HighlightButton icon="credit-card" size="medium" highlight>
            {t('purchase')}
          </HighlightButton>
        </ExternalLink>
      </div>
    ) : null

    return (
      <div className={cx(styles.container, this.props.className)}>
        {notice}
        <p>{msg}</p>
        <ClipboardTextInput
          className={styles.idContainer}
          inputClassName={styles.idText}
          defaultValue={this.props.hostId}
          disabled
        />
      </div>
    )
  }
}

export default connect(mapStateToProps)(Invite) as React.ComponentClass<IProps>
