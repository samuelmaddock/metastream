import React, { Component } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import styles from './WebBrowser.css'
import { WebControls } from 'components/browser/Controls'
import { assetUrl, absoluteUrl } from 'utils/appUrl'
import { IReactReduxProps } from 'types/redux-thunk'
import { Webview } from 'components/Webview'
import { sendMediaRequest } from 'lobby/actions/media-request'
import { DonateBar } from 'components/account/DonateBar'
import { HomeScreen } from './HomeScreen'
import { Portal } from 'components/Portal'

const DEFAULT_URL = absoluteUrl(`${assetUrl('webview.html')}`)

interface IProps {
  className?: string
  initialUrl?: string
  onClose?: () => void
}

type PrivateProps = IProps & IReactReduxProps

interface State {
  showHomescreen?: boolean
}

export class _WebBrowser extends Component<PrivateProps, State> {
  state: State = {}

  private webview?: Webview | null
  private controls?: WebControls | null

  private hasSetupControls?: boolean

  private get initialUrl() {
    return this.props.initialUrl || DEFAULT_URL
  }

  private dispatchCommand = (cmd: string) => {
    if (!this.webview) {
      return
    }

    switch (cmd) {
      case 'window:close':
        if (this.props.onClose) {
          this.props.onClose()
        }
        break
      case 'window:focus-url':
        if (this.controls) {
          this.controls.focusURL()
        }
        break
      case 'window:history-prev':
        // if (this.webContents.canGoBack()) {
        //   this.webContents.goBack()
        // }
        break
      case 'window:history-next':
        // if (this.webContents.canGoForward()) {
        //   this.webContents.goForward()
        // }
        break
    }
  }

  private setupControls() {
    if (!this.hasSetupControls && this.controls && this.webview) {
      this.controls.setWebview(this.webview)
      this.hasSetupControls = true
    }
  }

  private setupWebview = (webview: Webview | null): void => {
    this.webview = webview

    if (this.webview) {
      this.setupControls()
    } else if (this.hasSetupControls && this.controls) {
      this.controls.setWebview(null)
    }
  }

  private requestUrl = (url: string, source: string) => {
    this.props.dispatch(sendMediaRequest({ url, source }))

    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render(): JSX.Element {
    return (
      <div className={cx(styles.container, this.props.className)}>
        <WebControls
          ref={el => {
            this.controls = el
            this.setupControls()
          }}
          initialUrl={this.initialUrl}
          onClose={this.props.onClose}
          onRequestUrl={url => this.requestUrl(url, 'browser')}
        />
        {this.renderContent()}
        <DonateBar className={styles.donateBar} />
        {this.state.showHomescreen && this.renderHomescreen()}
      </div>
    )
  }

  private renderContent() {
    return (
      <Webview
        componentRef={this.setupWebview}
        src={this.initialUrl}
        className={styles.content}
        onNavigate={url => {
          const showHomescreen = url === DEFAULT_URL
          if (showHomescreen) {
            this.setState({ showHomescreen: false }) // force remount
            this.setState({ showHomescreen })
          }
        }}
      />
    )
  }

  private renderHomescreen() {
    const iframe = this.webview && this.webview.getIFrame()
    const wvDoc = iframe && iframe.contentDocument && iframe.contentDocument.body
    if (!wvDoc) return null

    return (
      <Portal container={wvDoc}>
        <HomeScreen onRequestUrl={url => this.requestUrl(url, 'homescreen')} />
      </Portal>
    )
  }
}

export const WebBrowser = connect()(_WebBrowser)
