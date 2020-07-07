import React, { Component } from 'react'
import styles from './Popup.css'
import { HighlightButton } from './common/button'
import { t } from 'locale'
import { Trans } from 'react-i18next'
import { isFirefox } from 'utils/browser'
import { createPortal } from 'react-dom'
import { Remote } from './remote'
import { dispatchExtensionMessage } from 'utils/extension'
import { ASSETS_PATH } from 'utils/appUrl'

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
  remotePopupReady: boolean
  mediaPopupReady: boolean
}

export class PopupWindow extends Component<Props, State> {
  state: State = { open: false, remotePopupReady: false, mediaPopupReady: false }

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

  private get mediaHostname(): string | undefined {
    const { mediaSrc } = this.props
    if (mediaSrc) {
      try {
        return new URL(mediaSrc).hostname
      } catch {}
    }
    if (mediaSrc && mediaSrc.startsWith(ASSETS_PATH)) {
      return
    }
    return mediaSrc || ''
  }

  private intervalId?: number
  private stylesheetObserver?: MutationObserver

  componentWillUnmount() {
    this.closeWindows()
  }

  private areWindowsOpen = () => {
    return Boolean(
      PopupWindow.mediaWindowRef &&
        !PopupWindow.mediaWindowRef.closed &&
        (PopupWindow.remoteWindowRef && !PopupWindow.remoteWindowRef.closed)
    )
  }

  private closeWindows = () => {
    this.setState({ open: false, remotePopupReady: false, mediaPopupReady: false })

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

  private checkWindows = () => {
    if (
      (PopupWindow.mediaWindowRef && PopupWindow.mediaWindowRef.closed) ||
      (PopupWindow.remoteWindowRef && PopupWindow.remoteWindowRef.closed)
    ) {
      this.closeWindows()
      return
    }

    // Force re-render of remote window
    if (PopupWindow.remoteWindowRef && !PopupWindow.remoteWindowRef.closed) {
      const remoteDocument = PopupWindow.remoteWindowRef.document
      const stylesheets = remoteDocument.styleSheets
      if (stylesheets.length === 0) {
        this.setState({ remotePopupReady: false })
        this.onWindowLoad()
      }
    }
  }

  private startWindowCheck = () => {
    if (this.areWindowsOpen()) {
      this.setState({ open: true })
      if (this.intervalId) clearInterval(this.intervalId)
      this.intervalId = setInterval(this.checkWindows, 500) as any
      this.props.theRef(true)
    }
  }

  private onWindowLoad = () => {
    this.setState({
      remotePopupReady: Boolean(PopupWindow.remoteWindowRef && !PopupWindow.remoteWindowRef.closed),
      mediaPopupReady: Boolean(PopupWindow.mediaWindowRef && !PopupWindow.mediaWindowRef.closed)
    })

    if (this.stylesheetObserver) {
      this.stylesheetObserver.disconnect()
    }

    this.stylesheetObserver = new MutationObserver(this.onHeadMutation)
    this.stylesheetObserver.observe(document.head, { childList: true })

    this.copyStyleSheets()
  }

  private onHeadMutation: MutationCallback = list => {
    const shouldCopyStyles = list.some(record => record.type === 'childList')
    if (shouldCopyStyles) {
      this.copyStyleSheets()
    }
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
          remoteDocument.head.appendChild(stylesheet.ownerNode.cloneNode(true))
        }
      })
    }
  }

  private openWindows = () => {
    this.openRemoteWindow()
    this.openMediaWindow()
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
      windowRef.addEventListener('DOMContentLoaded', this.onWindowLoad)
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
        setTimeout(this.onWindowLoad, 10)
      }

      this.startWindowCheck()
    }, 0)
  }

  private renderRemote() {
    if (!(PopupWindow.remoteWindowRef && this.state.remotePopupReady)) return

    const remoteDocument = PopupWindow.remoteWindowRef.document
    const root = remoteDocument.getElementById('root')
    if (!root) return

    return createPortal(<Remote />, root)
  }

  private renderPopupIcon() {
    return (
      <p>
        <svg
          width="220"
          height="147"
          viewBox="0 0 220 147"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke={this.state.mediaPopupReady ? '#f98673' : 'white'}>
            <rect x="1" y="1" width="154" height="145" strokeWidth="2" />
            <line x1="8.74228e-08" y1="10" x2="154" y2="10" strokeWidth="2" />
            <path d="M65.5 51.3494L103 73L65.5 94.6506L65.5 51.3494Z" strokeWidth="2" />
          </g>
          <g stroke={this.state.remotePopupReady ? '#f98673' : 'white'}>
            <rect x="159" y="1" width="60" height="145" strokeWidth="2" />
            <line x1="159" y1="10" x2="220" y2="10" strokeWidth="2" />
            <line x1="166" y1="18" x2="213" y2="18" strokeWidth="2" />
            <line x1="166" y1="139" x2="213" y2="139" strokeWidth="2" />
            <line x1="166" y1="24" x2="213" y2="24" strokeWidth="2" />
            <line x1="166" y1="30" x2="199" y2="30" strokeWidth="2" />
          </g>
        </svg>
      </p>
    )
  }

  private renderPopupPrompt() {
    const { mediaHostname } = this
    const onePopupOpen =
      (this.state.remotePopupReady || this.state.mediaPopupReady) &&
      (!this.state.remotePopupReady || !this.state.mediaPopupReady)

    return (
      <div className={styles.text}>
        {mediaHostname && (
          <p>
            <Trans i18nKey="embedBlocked" values={{ host: mediaHostname }}>
              To enable playback with <strong>this website</strong>, Metastream must open the
              website in a popup.
            </Trans>
          </p>
        )}
        {this.renderPopupIcon()}
        {onePopupOpen ? <p>⚠️&nbsp;{t('popupBlocked')}</p> : null}
        <HighlightButton highlight icon="external-link" size="large" onClick={this.openWindows}>
          {t('openInPopup')}
          {onePopupOpen ? ' ' + t('openSecondPopup') : null}
        </HighlightButton>
      </div>
    )
  }

  private renderFocusPopups() {
    const { mediaHostname } = this
    return (
      <div className={styles.text}>
        {mediaHostname && (
          <p>
            <Trans i18nKey="playingInPopup" values={{ host: mediaHostname }}>
              <strong>website</strong> is playing in a popup.
            </Trans>
          </p>
        )}
        {this.renderPopupIcon()}
        <HighlightButton icon="external-link" size="large" onClick={PopupWindow.focus}>
          {t('focusPopup')}
        </HighlightButton>
      </div>
    )
  }

  render() {
    const { backgroundImage } = this.props

    return (
      <div className={styles.container}>
        {backgroundImage && (
          <div
            className={styles.background}
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}
        {this.state.open ? this.renderFocusPopups() : this.renderPopupPrompt()}
        {this.renderRemote()}
      </div>
    )
  }
}
