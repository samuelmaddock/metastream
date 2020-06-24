import React, { Component } from 'react'
import styles from './Popup.css'
import { HighlightButton } from './common/button'
import { t } from 'locale'
import { Trans } from 'react-i18next'
import { isFirefox } from 'utils/browser'
import { createPortal } from 'react-dom'
import { Remote } from './remote'
import { dispatchExtensionMessage } from 'utils/extension'

const POPUP_WIDTH = 336 // px

const encodeFeatures = (features: any) =>
  Object.keys(features)
    .map(key => {
      const value = features[key]
      return value ? `${key}=${value}` : `${key}`
    })
    .join(',')

/** Gets maximum screen space rect for popups. */
const getPopupRect = () => {
  const isFF = isFirefox()

  const chromeOffset = {
    top: 1,
    left: 9,
    width: 0,
    height: 62
  }

  const firefoxOffset = {
    top: 0,
    left: 7,
    width: 14,
    height: 8
  }

  return {
    width: isFF
      ? screen.availWidth - firefoxOffset.width
      : screen.availWidth - chromeOffset.width - chromeOffset.left,
    height: isFF
      ? screen.availHeight - firefoxOffset.height
      : screen.availHeight - chromeOffset.height - chromeOffset.top,
    top: (screen as any).availTop || 0,
    left: (screen as any).availLeft || 0
  }
}

interface Props {
  id: number
  src: string
  mediaSrc?: string
  theRef: (e: true | null) => void
  onClose: Function
  backgroundImage?: string
}

interface State {
  open: boolean
  loaded: boolean
}

export class PopupWindow extends Component<Props, State> {
  state: State = { open: false, loaded: false }

  static mediaWindowRef: Window | null = null
  static remoteWindowRef: Window | null = null

  static loadURL(url: string) {
    if (this.mediaWindowRef) {
      try {
        this.mediaWindowRef.location.href = url
      } catch (e) {
        console.error(e)
        this.mediaWindowRef.close()
        this.mediaWindowRef = null
      }
    }
  }

  static focus() {
    if (PopupWindow.mediaWindowRef && !PopupWindow.mediaWindowRef.closed) {
      PopupWindow.mediaWindowRef.focus()
    }

    const focusRemote = () => {
      if (PopupWindow.remoteWindowRef && !PopupWindow.remoteWindowRef.closed) {
        PopupWindow.remoteWindowRef.focus()
      }
    }

    focusRemote()
    setTimeout(focusRemote, 0)
  }

  private get mediaHostname(): string {
    const { mediaSrc } = this.props
    if (mediaSrc) {
      try {
        return new URL(mediaSrc).hostname
      } catch {}
    }
    return mediaSrc || ''
  }

  private intervalId?: number
  private stylesheetObserver?: MutationObserver

  componentWillUnmount() {
    this.closeWindows()
  }

  private isWindowOpen = () => {
    return Boolean(
      (PopupWindow.mediaWindowRef && !PopupWindow.mediaWindowRef.closed) ||
        (PopupWindow.remoteWindowRef && !PopupWindow.remoteWindowRef.closed)
    )
  }

  private closeWindows = () => {
    this.setState({ open: false, loaded: false })

    const remoteWin = PopupWindow.remoteWindowRef
    const mediaWin = PopupWindow.mediaWindowRef

    if (remoteWin) {
      if (!remoteWin.closed) remoteWin.close()
      PopupWindow.remoteWindowRef = null
    }
    if (mediaWin) {
      if (!mediaWin.closed) mediaWin.close()
      PopupWindow.mediaWindowRef = null
    }

    if (this.stylesheetObserver) {
      this.stylesheetObserver.disconnect()
      this.stylesheetObserver = undefined
    }

    clearInterval(this.intervalId)
    this.intervalId = undefined

    this.props.theRef(null)
    this.props.onClose()
  }

  private checkClosed = () => {
    if (
      (PopupWindow.mediaWindowRef && PopupWindow.mediaWindowRef.closed) ||
      (PopupWindow.remoteWindowRef && PopupWindow.remoteWindowRef.closed)
    ) {
      this.closeWindows()
    }
  }

  private startWindowCheck = () => {
    if (this.isWindowOpen()) {
      this.setState({ open: true })
      if (this.intervalId) clearInterval(this.intervalId)
      this.intervalId = setInterval(this.checkClosed, 1000) as any
      this.props.theRef(true)
    }
  }

  private onWindowLoad = () => {
    this.setState({ loaded: true })

    this.stylesheetObserver = new MutationObserver(this.onHeadMutation)
    this.stylesheetObserver.observe(document.head, { childList: true })

    this.copyStyleSheets()
  }

  private onHeadMutation: MutationCallback = () => {
    this.copyStyleSheets()
  }

  private copyStyleSheets() {
    const remoteDocument = PopupWindow.remoteWindowRef && PopupWindow.remoteWindowRef.document
    if (remoteDocument) {
      // remove existing stylesheets
      Array.from(remoteDocument.styleSheets).forEach(stylesheet => {
        if (stylesheet.ownerNode) stylesheet.ownerNode.remove()
      })

      // add all stylesheets from main document
      Array.from(document.styleSheets).forEach(stylesheet => {
        if (stylesheet.ownerNode) {
          remoteDocument.head.appendChild(stylesheet.ownerNode.cloneNode())
        }
      })
    }
  }

  private openWindows = () => {
    this.openMediaWindow()
    this.openRemoteWindow()
    setTimeout(() => {
      PopupWindow.focus()
    }, 0)
  }

  private openRemoteWindow = () => {
    if (PopupWindow.remoteWindowRef && !PopupWindow.remoteWindowRef.closed) {
      PopupWindow.remoteWindowRef.focus()
      return
    }

    const features = {
      directories: 'no',
      location: 'no',
      menubar: 'no',
      resizable: 'yes',
      scrollbars: 'no',
      status: 'no',
      toolbar: 'no',
      ...getPopupRect()
    }

    const windowRef = window.open(
      `${location.origin}/assets/remote.html`,
      'MetastreamRemote',
      encodeFeatures({
        ...features,
        width: POPUP_WIDTH,
        left: Math.max(features.width - POPUP_WIDTH, 0)
      }),
      false
    )

    if (process.env.NODE_ENV === 'development') {
      ;(window as any).POPUP_REMOTE = windowRef
    }

    if (windowRef) {
      windowRef.addEventListener('load', this.onWindowLoad)
      PopupWindow.remoteWindowRef = windowRef
    }

    this.startWindowCheck()
  }

  private openMediaWindow = () => {
    if (PopupWindow.mediaWindowRef && !PopupWindow.mediaWindowRef.closed) {
      PopupWindow.mediaWindowRef.focus()
      return
    }

    dispatchExtensionMessage('metastream-popup-init', {
      id: this.props.id
    })

    // wait for extension to initialize popup
    setTimeout(() => {
      const features = {
        directories: 'no',
        location: 'no',
        menubar: 'no',
        resizable: 'yes',
        scrollbars: 'no',
        status: 'no',
        toolbar: 'no',
        ...getPopupRect()
      }

      const windowRef = window.open(
        this.props.src,
        'MetastreamMedia',
        encodeFeatures({
          ...features,
          width: Math.max(features.width - POPUP_WIDTH, POPUP_WIDTH)
        })
      )

      if (process.env.NODE_ENV === 'development') {
        ;(window as any).POPUP_MEDIA = PopupWindow.mediaWindowRef
      }

      if (windowRef) {
        PopupWindow.mediaWindowRef = windowRef
      }

      this.startWindowCheck()
    }, 0)
  }

  private renderRemote() {
    if (!(PopupWindow.remoteWindowRef && this.state.loaded)) return

    const remoteDocument = PopupWindow.remoteWindowRef.document.body.ownerDocument
    const root = remoteDocument.getElementById('root')
    if (!root) return

    return createPortal(<Remote />, root)
  }

  render() {
    const { backgroundImage } = this.props
    const { mediaHostname } = this

    return (
      <div className={styles.container}>
        {backgroundImage && (
          <div
            className={styles.background}
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}
        {this.state.open ? (
          <div className={styles.text}>
            <p>
              <Trans i18nKey="playingInPopup" values={{ host: mediaHostname }}>
                <strong>website</strong> is playing in a popup.
              </Trans>
            </p>
            <HighlightButton icon="external-link" size="large" onClick={PopupWindow.focus}>
              {t('focusPopup')}
            </HighlightButton>
            {this.renderRemote()}
          </div>
        ) : (
          <div className={styles.text}>
            <p>
              <Trans i18nKey="embedBlocked" values={{ host: mediaHostname }}>
                To enable playback with <strong>this website</strong>, Metastream must open the
                website in a popup.
              </Trans>
            </p>
            <HighlightButton highlight icon="external-link" size="large" onClick={this.openWindows}>
              {t('openInPopup')}
            </HighlightButton>
          </div>
        )}
      </div>
    )
  }
}
