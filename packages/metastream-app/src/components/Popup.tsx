import React, { Component } from 'react'
import { EventEmitter } from 'events'
import { isFirefox } from '../utils/browser'

interface Props {
  id: number
  src: string
  theRef: (e: true | null) => void
}

interface State {
  open: boolean
}

export class PopupWindow extends Component<Props, State> {
  state: State = { open: false }

  private window: Window | null = null
  private intervalId?: number

  componentWillUnmount() {
    if (this.window) {
      this.window.close()
      this.window = null
    }
  }

  private checkClosed = () => {
    if (this.window && this.window.closed) {
      this.setState({ open: false })
      this.window = null

      clearInterval(this.intervalId)
      this.intervalId = undefined

      this.props.theRef(null)
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
      this.window = window.open(this.props.src, 'targetWindow', features.join(','))
      ;(window as any).POPUP = this.window

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

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <button onClick={this.openWindow}>Open popup player</button>
      </div>
    )
  }
}
