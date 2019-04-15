import React, { Component } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import styles from './WebBrowser.css'
import { WebControls } from 'components/browser/Controls'
import { sendMediaRequest } from 'lobby/actions/mediaPlayer'
import { assetUrl } from 'utils/appUrl'
import { IReactReduxProps } from 'types/redux-thunk'
import { Webview } from 'components/Webview'

const DEFAULT_URL = assetUrl('homescreen.html')

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
        />
        {this.renderContent()}
      </div>
    )
  }

  private renderContent() {
    return (
      <Webview componentRef={this.setupWebview} src={this.initialUrl} className={styles.content} />
    )
  }
}

export const WebBrowser = connect()(_WebBrowser) as React.ComponentClass<IProps>
