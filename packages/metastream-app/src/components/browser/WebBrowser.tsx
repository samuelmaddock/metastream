import React, { Component } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import shortid from 'shortid'

import styles from './WebBrowser.css'
import { WebControls } from 'components/browser/Controls'
import { assetUrl } from 'utils/appUrl'
import { IReactReduxProps } from 'types/redux-thunk'
import { Webview } from 'components/Webview'
import { sendMediaRequest } from 'lobby/actions/media-request'
import { DonateBar } from 'components/account/DonateBar'

const NONCE = shortid()
const DEFAULT_URL = `${assetUrl('homescreen.html')}?nonce=${NONCE}`

interface IProps {
  className?: string
  initialUrl?: string
  onClose?: () => void
}

type PrivateProps = IProps & IReactReduxProps

export class _WebBrowser extends Component<PrivateProps> {
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
      </div>
    )
  }

  private renderContent() {
    return (
      <Webview
        componentRef={this.setupWebview}
        src={this.initialUrl}
        className={styles.content}
        onMessage={event => {
          const { data } = event
          if (
            typeof data !== 'object' ||
            typeof data.type !== 'string' ||
            typeof data.payload !== 'object'
          ) {
            return
          }

          const { type, payload } = data
          if (type === 'add-to-session' && payload.nonce === NONCE) {
            this.requestUrl(payload.url, 'homescreen')
          }
        }}
      />
    )
  }
}

export const WebBrowser = connect()(_WebBrowser)
