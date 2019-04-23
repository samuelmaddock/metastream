import React, { Component } from 'react'
import cx from 'classnames'

import { IconButton, HighlightButton } from 'components/common/button'

import styles from './Controls.css'
import { t } from 'locale'
import { Webview } from 'components/Webview'

interface IProps {
  initialUrl: string
  className?: string
  onRequestUrl?: (url: string) => void
  onClose?: () => void
}

interface IState {
  url?: string
  loading?: boolean
  canRequest?: boolean
}

export class WebControls extends Component<IProps, IState> {
  private webview: Webview | null = null
  private addressInput: HTMLInputElement | null = null

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
            this.webview.goBack()
          }
        }}
        // disabled={this.webview ? this.webview.getURL() === this.props.initialUrl : true}
      />
    )

    const forwardBtn = (
      <IconButton
        className={styles.button}
        icon="arrow-right"
        onClick={() => {
          if (this.webview) {
            this.webview.goForward()
          }
        }}
        // disabled={this.webview ? !this.webContents.canGoForward() : true}
      />
    )

    const refreshBtn = (
      <IconButton
        className={styles.button}
        icon={this.state.loading ? 'x' : 'rotate-cw'}
        onClick={e => {
          if (this.webview) {
            if (this.state.loading) {
              this.webview.stop()
            } else if (e.shiftKey || process.env.NODE_ENV === 'development') {
              this.webview.reloadIgnoringCache()
            } else {
              this.webview.reload()
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
            this.webview.loadURL(this.props.initialUrl)
          }
        }}
      />
    )

    const playBtn = (
      <div className={styles.requestButtonContainer}>
        <HighlightButton
          icon="play"
          onClick={this.onPlayClicked.bind(this)}
          disabled={!this.state.canRequest}
          highlight={this.state.canRequest}
        >
          {t('requestUrl')}
        </HighlightButton>
      </div>
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
              this.onAddressChange()
            }}
            placeholder={t('requestUrlPlaceholder')}
            spellCheck={false}
            autoFocus
          />
        </div>
      </div>
    )
  }

  setWebview(webview: Webview | null) {
    this.webview = webview

    if (this.webview) {
      const updateUrl = (e: { url: string }) => this.updateURL(e.url)
      this.webview.addEventListener('will-navigate', updateUrl)
      this.webview.addEventListener('did-navigate', updateUrl)
      this.webview.addEventListener('did-navigate-in-page', updateUrl)

      const setLoading = (loading: boolean) => this.setState({ loading })
      this.webview.addEventListener('will-navigate', setLoading.bind(null, true))
      this.webview.addEventListener('did-navigate', setLoading.bind(null, false))
      this.webview.addEventListener('did-navigate-in-page', setLoading.bind(null, false))
      this.webview.addEventListener('did-stop-loading', setLoading.bind(null, false))
    } else {
      // TODO
    }
  }

  focusURL() {
    if (this.addressInput) {
      this.addressInput.focus()
      this.addressInput.select()
    }
  }

  private updateURL(url: string) {
    if (url.startsWith(location.origin)) {
      url = ''
    }

    if (this.addressInput) {
      const prevUrl = this.addressInput.value
      if (prevUrl !== url) {
        this.addressInput.value = url
        this.onAddressChange()
        this.forceUpdate()
      }
    }
  }

  private requestUrl(url: string) {
    if (url.startsWith(location.origin)) {
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
        // this.webview!.focus()
      }
    }
  }

  private onAddressChange() {
    const url = this.addressUrl
    const canRequest = !!(url && url.length >= 1)
    if (canRequest !== this.state.canRequest) {
      this.setState({ canRequest })
    }
  }

  private loadURL(url: string) {
    if (!url.match(/^[\w-]+?:\/\//i)) {
      url = `https://${url}`
    }

    if (this.webview) {
      this.webview.loadURL(url)
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
