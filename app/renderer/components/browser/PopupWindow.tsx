const { ipcRenderer } = chrome

import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import { findDOMNode } from 'react-dom'
import cx from 'classnames'

import styles from './PopupWindow.css'
import { IExtension, getBrowserActionBackgroundImage } from '../../reducers/extensions'
import { IAppState } from '../../reducers/index'
import { showExtensionPopup } from '../../actions/extensions'
import { WEBVIEW_PARTITION } from '../../../constants/http'

interface IProps {
  src: string
  left: number
  top: number
  width?: number
  height?: number
}

type PrivateProps = IProps & DispatchProp<IAppState>

export class _PopupWindow extends Component<PrivateProps> {
  private get src() {
    const win = window as any
    const tabId = win.__POPUP_TAB_ID__

    // HACK: Force 'tabId' for uBlock Origin. Otherwise it attempts to get the current
    // window's tab ID instead of the webview.
    return this.props.src + (tabId ? `?tabId=${tabId}` : '')
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown)

    if (this.props.src) {
      let webview = document.createElement('webview')
      webview.setAttribute('src', this.src)
      webview.setAttribute('name', 'browserAction')
      webview.setAttribute('partition', WEBVIEW_PARTITION)
      webview.addEventListener('crashed', this.closePopup)
      webview.addEventListener('destroyed', this.closePopup)
      webview.addEventListener('close', this.closePopup)
      webview.addEventListener('did-attach' as any, () => {
        webview.enablePreferredSizeMode(true)
      })
      webview.addEventListener('preferred-size-changed' as any, () => {
        webview.getPreferredSize(preferredSize => {
          const width = preferredSize.width
          const height = preferredSize.height
          webview.style.height = height + 'px'
          webview.style.width = width + 'px'

          this.props.dispatch!(
            showExtensionPopup({
              left: this.props.left,
              top: this.props.top,
              height: height,
              width: width,
              src: this.props.src
            })
          )
        })
      })
      findDOMNode(this).appendChild(webview as Node)
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown)
  }

  private closePopup = () => {
    this.props.dispatch!(showExtensionPopup())
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.closePopup()
    }
  }

  render(): JSX.Element {
    let style: { [key: string]: any } = {}

    if (this.props.width) {
      style.width = this.props.width
    } else {
      style.boxShadow = 'none'
    }

    if (this.props.height) {
      style.height = this.props.height
    }

    if (this.props.top) {
      if (this.props.height && this.props.top + this.props.height < window.innerHeight) {
        style.top = this.props.top
      } else {
        style.bottom = 0
      }
    }

    if (this.props.left) {
      if (this.props.width && this.props.left + this.props.width < window.innerWidth) {
        style.left = this.props.left
      } else {
        style.right = '1em'
      }
    }

    return <div className={styles.container} style={style} />
  }
}

export const PopupWindow = connect()(_PopupWindow)
