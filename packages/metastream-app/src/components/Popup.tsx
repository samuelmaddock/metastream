import React, { Component } from 'react'

interface Props {
  id: number
  src: string
  theRef: (e: true | null) => void
  onClose: Function
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

  componentWillMount() {
    this.openWindow()
  }

  componentWillUnmount() {
    if (this.window) {
      this.window.close()
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

  render() {
    if (this.state.open) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'black'
          }}
        >
          Playing in popup window
        </div>
      )
    }

    return null
  }
}
