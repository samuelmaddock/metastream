import React, { Component } from 'react'
import { DispatchProp, connect } from 'react-redux'
import cx from 'classnames'

import styles from './Modal.css'
import { IAppState } from 'renderer/reducers'
import { IconButton } from 'renderer/components/common/button'

interface IProps {
  className?: string
  onClose?: () => void
}

type PrivateProps = IProps & DispatchProp<IAppState>

export class Modal extends Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <div className={cx(styles.container, this.props.className)}>
        <IconButton icon="x" className={styles.close} onClick={this.props.onClose} />
        {this.props.children}
      </div>
    )
  }
}
