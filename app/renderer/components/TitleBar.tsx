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
import { Icon } from './Icon'
import { push } from 'react-router-redux'

const WINDOW_EVENTS = [
  'maximize',
  'minimize',
  'unmaximize',
  'restore',
  'enter-full-screen',
  'leave-full-screen'
]

interface IProps {
  className?: string
  title?: string
}

interface IConnectedProps {
  updateAvailable?: boolean
  showBackButton: boolean
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>

class _TitleBar extends Component<PrivateProps> {
  private _platform?: string

  get window() {
    return remote.getCurrentWindow()
  }

  get platform() {
    return (this._platform = this._platform || remote.require('os').platform())
  }

  private updateWindowState = () => {
    this.forceUpdate()
  }

  componentDidMount() {
    WINDOW_EVENTS.forEach(eventName =>
      this.window.addListener(eventName as any, this.updateWindowState)
    )
  }

  componentWillUnmount() {
    WINDOW_EVENTS.forEach(eventName =>
      this.window.removeListener(eventName as any, this.updateWindowState)
    )
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
          {this.props.showBackButton && this.renderBack()}
          {this.platform === 'win32' && this.renderWin32Actions()}
        </div>
      </div>
    )
  }

  private renderWin32Actions() {
    const buttons = [
      {
        label: <Icon name={this.window.isFullScreen() ? 'minimize-2' : 'maximize-2'} />,
        action: () => this.window.setFullScreen(!this.window.isFullScreen())
      },
      {
        label: <span className={styles.winIcon}>0</span>, // 🗕
        action: () => this.window.minimize()
      },
      {
        label: <span className={styles.winIcon}>{this.window.isMaximized() ? '2' : '1'}</span>, // 🗖
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
        label: <span className={styles.winIcon}>r</span>, // ✕
        action: () => this.window.close(),
        className: styles.close
      }
    ]

    return (
      <div className={styles.rightActions}>
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            className={cx(styles.actionButton, btn.className)}
            onClick={btn.action}
          >
            {btn.label}
          </button>
        ))}
      </div>
    )
  }

  private renderBack() {
    return (
      <div
        className={cx(styles.leftActions, {
          darwin: this.platform === 'darwin'
        })}
      >
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => this.props.dispatch!(push('/'))}
        >
          <Icon name="arrow-left" />
        </button>
      </div>
    )
  }
}

export const TitleBar = connect(
  (state: IAppState): IConnectedProps => {
    const { location } = state.router
    return {
      updateAvailable: isUpdateAvailable(state),
      showBackButton: location ? location.pathname !== '/' : true
    }
  }
)(_TitleBar) as React.ComponentClass<IProps>
