import React, { Component } from 'react'
import { EventEmitter } from 'events'

interface Props {
  src?: string
  className?: string
  componentRef?: (c: Webview | null) => any
}

let webviewId = 0

export class Webview extends Component<Props> {
  private id = webviewId++
  private frameId = -1
  private emitter = new EventEmitter()
  private iframe: HTMLIFrameElement | null = null

  private get initialUrl() {
    return `about:blank?webview=${this.id}`
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy */
  private get featurePolicy() {
    // prettier-ignore
    return [
      'midi',
      'fullscreen',
      'animations',
      'picture-in-picture',
      'encrypted-media',
      'autoplay'
    ].map(feature => `${feature} *`).join(', ')
  }

  constructor(props: Props) {
    super(props)

    this.onMessage = this.onMessage.bind(this)

    window.addEventListener('message', this.onMessage)
  }

  private onMessage(event: MessageEvent) {
    const { data } = event
    if (typeof data !== 'object' || typeof data.type !== 'string') return

    if (data.type === `metastream-webview-init${this.id}`) {
      const { frameId } = data.payload
      this.frameId = frameId
      this.onInitialized()
      return
    } else if (this.frameId < 0) {
      return // wait to initialize
    }

    // Filter out messages from non-subframe descendants
    const { framePath } = data
    if (!Array.isArray(framePath) || framePath[1] !== this.frameId) {
      return
    }

    if (data.type === 'metastream-webview-event') {
      const action = data.payload
      this.emitter.emit(action.type, action.payload)
    }
  }

  private onInitialized() {
    if (this.props.src) {
      this.loadURL(this.props.src)
    }

    this.emitter.emit('webview-ready')
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.onMessage)
    this.emitter.removeAllListeners()
  }

  render() {
    const { componentRef, src, ...rest } = this.props

    return (
      <iframe
        ref={e => {
          this.iframe = e
          if (componentRef) {
            componentRef(e ? this : null)
          }
        }}
        allow={this.featurePolicy}
        src={this.initialUrl}
        {...rest}
      />
    )
  }

  loadURL(url: string, opts: { httpReferrer?: string; userAgent?: string } = {}) {
    if (this.iframe) {
      this.iframe.src = url
    }
  }

  addEventListener(eventName: string, listener: (...args: any[]) => void) {
    this.emitter.addListener(eventName, listener)
  }

  removeEventListener(eventName: string, listener: (...args: any[]) => void) {
    this.emitter.removeListener(eventName, listener)
  }
}
