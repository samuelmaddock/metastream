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
  componentDidMount() {
    if (this.props.onClose) {
      document.addEventListener('keydown', this.onKeyPress, false)
    }
  }

  componentWillUnmount() {
    if (this.props.onClose) {
      document.removeEventListener('keydown', this.onKeyPress, false)
    }
  }

  private onKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.props.onClose && this.props.onClose()
    }
  }

  render(): JSX.Element {
    return (
      <div className={cx(styles.container, this.props.className)}>
        <IconButton icon="x" className={styles.close} onClick={this.props.onClose} />
        {this.props.children}
      </div>
    )
  }
}
