import React, { Component } from 'react'
import cx from 'classnames'

import { t } from 'locale'
import { StorageKey } from 'constants/storage'
import { Webview } from 'components/Webview'
import { IconButton, HighlightButton } from 'components/common/button'
import { HighlightText, MediumText } from '../common/typography'

import styles from './Controls.css'

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
  showAddHint?: boolean
}

export class WebControls extends Component<IProps, IState> {
  private webview: Webview | null = null
  private addressInput: HTMLInputElement | null = null
  private mounted: boolean = false

  state: IState = {}

  private get addressUrl() {
    return (this.addressInput && this.addressInput.value) || ''
  }

  componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
  }

  render(): JSX.Element {
    // back, forward, location bar, play button, exit
    const addressUrl = this.addressUrl

    const backBtn = (
      <IconButton
        className={styles.button}
        icon="arrow-left"
        onClick={() => {
          if (this.webview) {
            this.webview.goBack()
          }
        }}
        // try to prevent player iframe navigation
        disabled={addressUrl.length === 0}
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
          title={
            <MediumText>
              When you&rsquo;re ready to share, press the{' '}
              <HighlightText>Add To Session</HighlightText> button.
            </MediumText>
          }
          tooltipProps={
            {
              classes: { tooltip: styles.addHintTooltip },
              placement: 'bottom-end',
              open: !!this.state.showAddHint
            } as any
          }
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

  private onNavigation = (e: { url: string }) => this.updateURL(e.url)
  private setStartedLoading = () => this.setState({ loading: true })
  private setStoppedLoading = () => this.setState({ loading: false })

  setWebview(webview: Webview | null) {
    if (webview) {
      webview.addEventListener('will-navigate', this.onNavigation)
      webview.addEventListener('did-navigate', this.onNavigation)
      webview.addEventListener('did-navigate-in-page', this.onNavigation)

      webview.addEventListener('will-navigate', this.setStartedLoading)
      webview.addEventListener('did-navigate', this.setStoppedLoading)
      webview.addEventListener('did-navigate-in-page', this.setStoppedLoading)
      webview.addEventListener('did-stop-loading', this.setStoppedLoading)
    } else if (this.webview) {
      this.webview.removeEventListener('will-navigate', this.onNavigation)
      this.webview.removeEventListener('did-navigate', this.onNavigation)
      this.webview.removeEventListener('did-navigate-in-page', this.onNavigation)

      this.webview.removeEventListener('will-navigate', this.setStartedLoading)
      this.webview.removeEventListener('did-navigate', this.setStoppedLoading)
      this.webview.removeEventListener('did-navigate-in-page', this.setStoppedLoading)
      this.webview.removeEventListener('did-stop-loading', this.setStoppedLoading)
    }

    this.webview = webview
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
      }
    }
  }

  private onAddressChange() {
    const url = this.addressUrl
    const canRequest = !!(url && url.length >= 1)
    if (canRequest !== this.state.canRequest) {
      this.setState({ canRequest })

      if (canRequest) {
        this.checkShowAddHint()
      }
    }
  }

  private checkShowAddHint() {
    const hasRequestedMediaBefore = Boolean(localStorage.getItem(StorageKey.RequestCount))

    if (!hasRequestedMediaBefore) {
      setTimeout(() => {
        if (this.mounted) {
          this.setState({ showAddHint: true })
        }
      }, 5e3)
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
