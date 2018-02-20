import React, { Component } from 'react'
import { DispatchProp, connect } from 'react-redux'
import cx from 'classnames'

import styles from './Invite.css'
import { IAppState } from 'renderer/reducers'
import { PlatformService } from 'renderer/platform'
import { ClipboardTextInput } from 'renderer/components/common/input'

interface IProps {
  className?: string
  onClose?: () => void
}

type PrivateProps = IProps & DispatchProp<IAppState>

class _Invite extends Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <div className={cx(styles.container, this.props.className)}>
        <p>Send your ID to peeps to invite them</p>
        <ClipboardTextInput
          className={styles.idContainer}
          inputClassName={styles.idText}
          defaultValue={PlatformService.getLocalId().toString()}
          disabled
        />
      </div>
    )
  }
}

export const Invite = connect()(_Invite) as React.ComponentClass<IProps>
