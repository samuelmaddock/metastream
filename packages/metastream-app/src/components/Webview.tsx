import React, { Component } from 'react'
import cx from 'classnames'
import { EventEmitter } from 'events'
import { isFirefox } from '../utils/browser'
import { WebviewError } from './lobby/overlays/WebviewError'
import styles from './Webview.css'

/**
 * List of hostnames to apply service worker fix to.
 *
 * Chrome extensions can't intercept SWs yet so we need to
 * remove any service workers and then reload the page.
 */
const swFixOrigins = new Set(['https://www.netflix.com'])

const INITIALIZE_TIMEOUT_DURATION = 1000
const NAVIGATION_TIMEOUT_DURATION = 2000

interface Props {
  src?: string
  className?: string
  componentRef?: (c: Webview | null) => any
  /** Allow Metastream Remote extension to inject player scripts. */
  allowScripts?: boolean
}

interface State {
  timeout?: boolean
}

let webviewId = 0

export class Webview extends Component<Props, State> {
  state: State = {}

  private id = webviewId++
  private frameId = -1
  private emitter = new EventEmitter()
  private iframe: HTMLIFrameElement | null = null
  private url: string = 'about:blank'
  private didFixSW: boolean = false
  private navigateTimeoutId?: number
  private initializeTimeoutId?: number

  private get initialUrl() {
    return `about:blank?webview=${this.id}&allowScripts=${!!this.props.allowScripts}`
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy */
  private get featurePolicy() {
    // prettier-ignore
    return [
      'midi',
      'fullscreen',
      'geolocation',
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
      this.onWebviewMessage(data.payload, framePath)
    }
  }

  private onWebviewMessage(action: any, framePath: any) {
    if (typeof action.payload === 'object' && typeof action.payload.url === 'string') {
      this.url = action.payload.url
    }

    if (action.type === 'activity') {
      this.onIFrameActivity()
    } else {
      // if we receive a message from the frame, we know we were able to connect
      // ignore 'activity' since it's delayed
      this.clearNavigateTimeout()
    }

    // Whether the message was sent from the top subframe
    const isTopSubFrame = framePath[framePath.length - 1] === this.frameId

    this.emitter.emit(action.type, action.payload, isTopSubFrame)
  }

  private clearInitializeTimeout() {
    if (this.initializeTimeoutId) {
      clearTimeout(this.initializeTimeoutId)
      this.initializeTimeoutId = undefined
    }
    if (this.state.timeout) this.setState({ timeout: false })
  }

  private onInitializeTimeout = () => {
    this.clearInitializeTimeout()
    this.setState({ timeout: true })
  }

  private startInitializeTimeout() {
    this.clearInitializeTimeout()
    this.initializeTimeoutId = setTimeout(
      this.onInitializeTimeout,
      INITIALIZE_TIMEOUT_DURATION
    ) as any
  }

  private onInitialized() {
    this.clearInitializeTimeout()

    if (this.props.src) {
      this.loadURL(this.props.src)
    }

    this.emitter.on('will-navigate', this.willNavigate)
    this.emitter.on('did-navigate', this.didNavigate)
    this.emitter.emit('ready')
  }

  /** Notifies top frame of iframe activity */
  private onIFrameActivity() {
    const e = new Event('mousemove', { cancelable: false, bubbles: true })
    document.dispatchEvent(e)
  }

  private removeServiceWorkers(origin: string) {
    window.postMessage(
      {
        type: 'metastream-remove-data',
        payload: {
          options: { origins: [origin] },
          dataToRemove: { serviceWorkers: true }
        }
      },
      location.origin
    )
  }

  private fixServiceWorker(url: string) {
    // Only apply SW fix to Chromium browsers
    if (isFirefox()) return

    // Ignore request to fix after hard reload
    if (this.didFixSW) {
      this.didFixSW = false
      return
    }

    let origin
    try {
      origin = new URL(url).origin
    } catch {
      return
    }

    const shouldFixSW = swFixOrigins.has(origin)
    if (!shouldFixSW) return

    this.didFixSW = true
    this.removeServiceWorkers(origin)

    // Perform full page reload after service worker has been removed
    this.emitter.once('did-navigate', () => {
      this.reloadIgnoringCache()
    })
  }

  private clearNavigateTimeout() {
    if (this.navigateTimeoutId) {
      clearTimeout(this.navigateTimeoutId)
      this.navigateTimeoutId = undefined
    }
    if (this.state.timeout) this.setState({ timeout: false })
  }

  private onNavigateTimeout = () => {
    this.clearNavigateTimeout()
    this.setState({ timeout: true })
  }

  private startNavigateTimeout() {
    this.clearNavigateTimeout()
    this.navigateTimeoutId = setTimeout(this.onNavigateTimeout, NAVIGATION_TIMEOUT_DURATION) as any
  }

  private willNavigate = ({ url }: { url: string }) => {
    if (process.env.NODE_ENV === 'development') {
      // TODO(samuelmaddock): only fix service worker if page fails to load after timeout
      // this.fixServiceWorker(url)
    }

    this.clearNavigateTimeout()
    this.startNavigateTimeout()
  }

  private didNavigate = () => {
    this.clearNavigateTimeout()
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.onMessage)
    this.emitter.removeAllListeners()
  }

  componentDidMount() {
    this.startInitializeTimeout()
  }

  render() {
    const { componentRef, src, allowScripts, className, ...rest } = this.props

    // TODO(samuelmaddock): Update React and types so these props can be passed in
    const untypedProps: any = {
      referrerPolicy: 'origin',
      allowtransparency: ''
    }

    return (
      <div className={cx(className, styles.container)}>
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
          className={styles.webview}
          {...untypedProps}
          {...rest}
        />
        {this.state.timeout ? <WebviewError className={styles.error} url={this.url} /> : null}
      </div>
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
    if (this.iframe) this.iframe.src = url
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
