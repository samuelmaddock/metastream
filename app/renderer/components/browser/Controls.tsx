import React, { Component } from 'react'
import cx from 'classnames'

import { Icon } from 'renderer/components/Icon'
import { IconButton, HighlightButton } from 'renderer/components/common/button'

import styles from './Controls.css'
import { MenuButton } from 'renderer/components/menu/MenuButton'

interface IProps {
  initialUrl: string
  className?: string
  onRequestUrl?: (url: string) => void
  onClose?: () => void
}

interface IState {
  url?: string
  loading?: boolean
}

export class WebControls extends Component<IProps, IState> {
  private webview: Electron.WebviewTag | null
  private webContents: Electron.WebContents
  private addressInput: HTMLInputElement | null

  state: IState = {}

  private get addressUrl() {
    return this.addressInput && this.addressInput.value
  }

  render(): JSX.Element {
    // back, forward, location bar, play button, exit

    const backBtn = (
      <IconButton
        className={styles.button}
        icon="arrow-left"
        onClick={() => {
          if (this.webview) {
            this.webContents.goBack()
          }
        }}
        disabled={this.webview ? !this.webContents.canGoBack() : true}
      />
    )

    const forwardBtn = (
      <IconButton
        className={styles.button}
        icon="arrow-right"
        onClick={() => {
          if (this.webview) {
            this.webContents.goForward()
          }
        }}
        disabled={this.webview ? !this.webContents.canGoForward() : true}
      />
    )

    const refreshBtn = (
      <IconButton
        className={styles.button}
        icon={this.state.loading ? 'x' : 'rotate-cw'}
        onClick={e => {
          if (this.webview) {
            if (this.state.loading) {
              this.webContents.stop()
            } else if (e.shiftKey) {
              this.webContents.reloadIgnoringCache()
            } else {
              this.webContents.reload()
            }
          }
        }}
      />
    )

    const homeBtn = (
      <IconButton
        className={styles.button}
        icon="home"
        onClick={e => {
          if (this.webview) {
            // TODO: navigate forward instead of back
            this.webContents.goToIndex(0)
          }
        }}
      />
    )

    const playBtn = (
      <div className={styles.requestButtonContainer}>
        <HighlightButton icon="play" onClick={this.onPlayClicked.bind(this)}>
          Request URL
        </HighlightButton>
      </div>
    )

    const canDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
    const debugBtn = canDebug ? (
      <IconButton
        className={styles.button}
        icon="settings"
        onClick={() => {
          if (this.webContents) {
            this.webContents.toggleDevTools()
          }
        }}
      />
    ) : (
      undefined
    )

    const closeBtn = (
      <IconButton className={styles.button} icon="x" onClick={this.onCloseClicked.bind(this)} />
    )

    return (
      <div className={cx(this.props.className, styles.container)}>
        {backBtn}
        {forwardBtn}
        {refreshBtn}
        {homeBtn}
        {this.renderLocation()}
        {playBtn}
        {debugBtn}
        {closeBtn}
      </div>
    )
  }

  private renderLocation(): JSX.Element {
    return (
      <div className={styles.locationContainer}>
        <div className={styles.locationBar}>
          <input
            ref={el => {
              this.addressInput = el
            }}
            type="text"
            className={styles.addressInput}
            onKeyPress={this.onLocationKeyPress}
            onChange={() => {
              /* force react controlled input */
            }}
            autoFocus
          />
        </div>
      </div>
    )
  }

  setWebview(webview: Electron.WebviewTag | null, webContents: Electron.WebContents) {
    this.webview = webview
    this.webContents = webContents

    if (this.webview) {
      this.webview.addEventListener('dom-ready', e => {
        if (this.webview) {
          this.updateURL(this.webContents.getURL())
        }
      })

      const updateUrl = (e: { url: string }) => {
        this.updateURL(e.url)
      }

      this.webview.addEventListener('will-navigate', updateUrl)
      this.webview.addEventListener('did-navigate-in-page', updateUrl)

      const setLoading = (loading: boolean) => this.setState({ loading })
      this.webview.addEventListener('did-start-loading', setLoading.bind(null, true))
      this.webview.addEventListener('did-stop-loading', setLoading.bind(null, false))
      this.webview.addEventListener('did-finish-load', setLoading.bind(null, false))
    }
  }

  focusURL() {
    if (this.addressInput) {
      this.addressInput.focus()
      this.addressInput.select()
    }
  }

  private updateURL(url: string) {
    if (url.startsWith('chrome://brave/')) {
      url = ''
    }

    if (this.addressInput) {
      this.addressInput.value = url
    }
  }

  private requestUrl(url: string) {
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return
    }

    const { onRequestUrl } = this.props
    if (onRequestUrl) {
      onRequestUrl(url)
    }
  }

  private onLocationKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()

      const url = this.addressUrl
      const shouldRequest = event.ctrlKey || event.shiftKey || event.altKey

      if (url && shouldRequest) {
        this.requestUrl(url)
      } else if (url) {
        this.loadURL(url)
        this.webview!.focus()
      }
    }
  }

  private loadURL(url: string) {
    // TODO: make this robust and use https everywhere extension
    if (!url.match(/^[\w-]+?:\/\//i)) {
      url = `http://${url}`
    }

    if (this.webview) {
      const httpReferrer = this.webview.getAttribute('httpreferrer') || undefined
      this.webContents.loadURL(url, { httpReferrer })
    }
  }

  private onPlayClicked() {
    const url = this.addressUrl
    if (url) {
      this.requestUrl(url)
    }
  }

  private onCloseClicked() {
    const { onClose } = this.props

    if (onClose) {
      onClose()
    }
  }
}
