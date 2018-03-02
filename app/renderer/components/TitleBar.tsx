const { remote } = chrome

import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import cx from 'classnames'

import * as packageJson from 'package.json'

import { IAppState } from 'renderer/reducers'
import { isUpdateAvailable } from 'renderer/reducers/ui'

import styles from './TitleBar.css'
import { IconButton } from 'renderer/components/common/button'
import { installUpdate } from 'renderer/actions/ui'

interface IProps {
  className?: string
  title?: string
}

interface IConnectedProps {
  updateAvailable?: boolean
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>

class _TitleBar extends Component<PrivateProps> {
  private _platform: string

  get window() {
    return remote.getCurrentWindow()
  }

  get platform() {
    return (this._platform = this._platform || remote.require('os').platform())
  }

  render(): JSX.Element | null {
    const updateButton = this.props.updateAvailable && (
      <IconButton
        icon="download"
        className={styles.updateButton}
        onClick={() => {
          this.props.dispatch!(installUpdate())
        }}
      >
        Update
      </IconButton>
    )

    return (
      <div className={cx(this.props.className, styles.container)}>
        <div className={styles.wrapper}>
          <header className={styles.header}>
            <h2 className={styles.title}>{this.props.title || packageJson.productName}</h2>
            <div className={styles.drag} />
          </header>
          {updateButton}
          {this.platform === 'win32' && this.renderWin32Actions()}
        </div>
      </div>
    )
  }

  private renderWin32Actions(): JSX.Element {
    const buttons = [
      {
        label: '0', // 🗕
        action: () => this.window.minimize()
      },
      {
        label: this.window.isMaximized() ? '2' : '1', // 🗖
        action: () => {
          if (this.window.isMaximized()) {
            this.window.restore()
          } else if (this.window.isMinimizable()) {
            this.window.maximize()
          }
          this.forceUpdate()
        }
      },
      {
        label: 'r', // ✕
        action: () => this.window.close()
      }
    ]

    return (
      <div className={styles.actions}>
        {buttons.map((btn, idx) => (
          <button key={idx} type="button" className={styles.actionButton} onClick={btn.action}>
            {btn.label}
          </button>
        ))}
      </div>
    )
  }
}

export const TitleBar = connect((state: IAppState): IConnectedProps => {
  return { updateAvailable: isUpdateAvailable(state) }
})(_TitleBar) as React.ComponentClass<IProps>
