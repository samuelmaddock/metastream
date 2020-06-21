import React, { Component } from 'react'
import styles from './Popup.css'
import { HighlightButton } from './common/button'
import { t } from 'locale'
import { Trans } from 'react-i18next'

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
}

export class PopupWindow extends Component<Props, State> {
  state: State = { open: false }

  static windowRef: Window | null = null

  static loadURL(url: string) {
    if (this.windowRef) {
      this.windowRef.location.href = url
    }
  }

  static focus() {
    if (this.windowRef) {
      this.windowRef.focus()
    }
  }

  private intervalId?: number

  private get window() {
    return PopupWindow.windowRef
  }

  componentWillUnmount() {
    if (this.window) {
      this.window.close()
      this.checkClosed()
      PopupWindow.windowRef = null
    }
  }

  private checkClosed = () => {
    if (this.window && this.window.closed) {
      this.setState({ open: false })
      PopupWindow.windowRef = null

      clearInterval(this.intervalId)
      this.intervalId = undefined

      this.props.theRef(null)
      this.props.onClose()
    }
  }

  private openWindow = () => {
    if (this.window && !this.window.closed) {
      this.window.focus()
      return
    }

    window.postMessage(
      {
        type: 'metastream-popup-init',
        payload: {
          id: this.props.id
        }
      },
      location.origin
    )

    setTimeout(() => {
      const features = ['resizable', 'scrollbars=no', 'status=no', 'width=1280', 'height=720']
      PopupWindow.windowRef = window.open(this.props.src, 'targetWindow', features.join(','))

      if (this.window) {
        this.setState({ open: true })
        this.intervalId = setInterval(this.checkClosed, 1000) as any
        this.props.theRef(true)
      }
    }, 0)
  }

  private renderDescription() {
    const { mediaSrc } = this.props

    if (mediaSrc) {
      try {
        const url = new URL(mediaSrc)
        return (
          <Trans i18nKey="embedBlocked" values={{ host: url.host }}>
            <strong>This website</strong> is embed blocked⁠—playback in a popup is required.
          </Trans>
        )
      } catch {}
    }
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
        {this.state.open ? (
          <div className={styles.text}>
            <p>{t('playingInPopup')}</p>
            <HighlightButton icon="external-link" size="large" onClick={this.openWindow}>
              {t('focusPopup')}
            </HighlightButton>
          </div>
        ) : (
          <div className={styles.text}>
            <p>{this.renderDescription()}</p>
            <HighlightButton highlight icon="external-link" size="large" onClick={this.openWindow}>
              {t('openInPopup')}
            </HighlightButton>
          </div>
        )}
      </div>
    )
  }
}
