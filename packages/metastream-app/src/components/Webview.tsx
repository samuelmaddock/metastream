import React, { Component } from 'react'
import { EventEmitter } from 'events'

interface Props {
  src?: string
  className?: string
  componentRef?: (c: Webview | null) => any
  /** Allow Metastream Remote extension to inject player scripts. */
  allowScripts?: boolean
}

let webviewId = 0

export class Webview extends Component<Props> {
  private id = webviewId++
  private frameId = -1
  private emitter = new EventEmitter()
  private iframe: HTMLIFrameElement | null = null
  private url: string = 'about:blank'

  private get initialUrl() {
    return `about:blank?webview=${this.id}&allowScripts=${!!this.props.allowScripts}`
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy */
  private get featurePolicy() {
    // prettier-ignore
    return [
      'midi',
      'fullscreen',
      'picture-in-picture',
      'encrypted-media',
      'autoplay'
    ].map(feature => `${feature} *`).join(', ')
  }

  private get sandboxPolicy() {
    // prettier-ignore
    return [
      'forms',
      'popups',
      'presentation',
      'same-origin',
      'scripts',
    ].map(feature => `allow-${feature}`).join(' ')
  }

  constructor(props: Props) {
    super(props)

    this.emitter.setMaxListeners(32)
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

      if (typeof action.payload === 'object' && typeof action.payload.url === 'string') {
        this.url = action.payload.url
      }

      if (action.type === 'activity') {
        this.onIFrameActivity()
      }

      // Whether the message was sent from the top subframe
      const isTopSubFrame = framePath[framePath.length - 1] === this.frameId

      this.emitter.emit(action.type, action.payload, isTopSubFrame)
    }
  }

  private onInitialized() {
    if (this.props.src) {
      this.loadURL(this.props.src)
    }

    this.emitter.emit('ready')
  }

  /** Notifies top frame of iframe activity */
  private onIFrameActivity() {
    const e = new Event('mousemove', { cancelable: false, bubbles: true })
    document.dispatchEvent(e)
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.onMessage)
    this.emitter.removeAllListeners()
  }

  render() {
    const { componentRef, src, allowScripts, ...rest } = this.props

    // TODO(samuelmaddock): Update React and types so these props can be passed in
    const untypedProps: any = {
      referrerPolicy: 'origin',
      allowtransparency: ''
    }

    return (
      <iframe
        ref={e => {
          this.iframe = e
          if (componentRef) {
            componentRef(e ? this : null)
          }
        }}
        allow={this.featurePolicy}
        sandbox={this.sandboxPolicy}
        src={this.initialUrl}
        // Required for Firefox until it supports allow attribute
        allowFullScreen
        {...untypedProps}
        {...rest}
      />
    )
  }

  addEventListener(eventName: string, listener: (...args: any[]) => void) {
    this.emitter.addListener(eventName, listener)
  }

  removeEventListener(eventName: string, listener: (...args: any[]) => void) {
    this.emitter.removeListener(eventName, listener)
  }

  private dispatchRemoteEvent<T>(type: string, payload?: T): void {
    if (!this.frameId) return
    window.postMessage(
      { type: 'metastream-webview-event', payload: { type, payload }, frameId: this.frameId },
      location.origin
    )
  }

  loadURL(url: string, opts: { httpReferrer?: string; userAgent?: string } = {}) {
    this.url = url

    if (this.iframe) {
      this.iframe.src = url
    }
  }

  getURL() {
    return this.url
  }

  goBack() {
    this.dispatchRemoteEvent('navigate', -1)
  }

  goForward() {
    this.dispatchRemoteEvent('navigate', 1)
  }

  stop() {
    this.dispatchRemoteEvent('stop')
    this.emitter.emit('did-stop-loading')
  }

  reload() {
    this.dispatchRemoteEvent('reload')
  }

  reloadIgnoringCache() {
    this.dispatchRemoteEvent('reload', true)
  }
}
