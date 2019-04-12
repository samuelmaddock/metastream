import React, { Component } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import styles from './WebBrowser.css'
import { WEBVIEW_PARTITION } from 'constants/http'
import { WebControls } from 'components/browser/Controls'
import { sendMediaRequest } from 'lobby/actions/mediaPlayer'
import { absoluteUrl } from 'utils/appUrl'
import { IReactReduxProps } from 'types/redux-thunk'

const DEFAULT_URL = absoluteUrl('./browser/resources/homescreen.html')

interface IProps {
  className?: string
  initialUrl?: string
  onClose?: () => void
  devTools?: boolean
}

type PrivateProps = IProps & IReactReduxProps

export class _WebBrowser extends Component<PrivateProps> {
  private webview?: HTMLIFrameElement | null
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
      // this.controls.setWebview(this.webview, this.webContents)
      this.hasSetupControls = true
    }
  }

  private setupWebview = (webview: HTMLIFrameElement | null): void => {
    this.webview = webview

    if (this.webview) {
      // this.setupControls()
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
          onRequestUrl={url => {
            this.props.dispatch(sendMediaRequest(url, 'browser'))

            if (this.props.onClose) {
              this.props.onClose()
            }
          }}
          devTools={this.props.devTools}
        />
        {this.renderContent()}
      </div>
    )
  }

  private renderContent() {
    return React.createElement('webview', {
      is: 'is',
      ref: this.setupWebview,
      src: this.initialUrl,
      class: styles.content,
      /* Some website embeds are disabled without an HTTP referrer */
      httpreferrer: 'http://mediaplayer.samuelmaddock.com/',
      plugins: 'true',
      partition: WEBVIEW_PARTITION,
      allowtransparency: true
    })
  }
}

export const WebBrowser = connect()(_WebBrowser) as React.ComponentClass<IProps>
