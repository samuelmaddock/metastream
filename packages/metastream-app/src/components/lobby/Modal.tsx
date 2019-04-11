import React, { Component } from 'react'
import cx from 'classnames'

import styles from './Modal.css'
import { IconButton } from 'components/common/button'

interface IProps {
  className?: string
  onClose?: () => void
}

export class Modal extends Component<IProps> {
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
        <div className={styles.content}>{this.props.children}</div>
      </div>
    )
  }
}
