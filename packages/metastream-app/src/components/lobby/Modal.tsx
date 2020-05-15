import React, { Component } from 'react'
import cx from 'classnames'

import styles from './Modal.css'
import { IconButton } from 'components/common/button'

interface IProps {
  className?: string
  onClose?: () => void
  fill?: boolean
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
        <IconButton
          id="modal_close"
          icon="x"
          className={styles.close}
          onClick={this.props.onClose}
        />
        <div
          className={cx(styles.content, {
            [styles.fill]: this.props.fill
          })}
        >
          {this.props.children}
        </div>
      </div>
    )
  }
}
