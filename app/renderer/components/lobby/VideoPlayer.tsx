import React, { Component } from 'react'
import cx from 'classnames'
import styles from './VideoPlayer.css'
import { IMediaItem, PlaybackState, IMediaPlayerState } from 'renderer/lobby/reducers/mediaPlayer'
import { Dispatch } from 'redux'
import {
  server_requestPlayPause,
  server_requestNextMedia,
  server_requestSeek,
  updateMedia,
  updatePlaybackTimer
} from 'renderer/lobby/actions/mediaPlayer'
import { DispatchProp, connect } from 'react-redux'
import { PlaybackControls } from 'renderer/components/media/PlaybackControls'
import { setVolume } from 'renderer/actions/settings'
import { clamp } from 'utils/math'
import { WEBVIEW_PARTITION, MEDIA_REFERRER } from 'constants/http'
import { absoluteUrl } from 'utils/appUrl'
import { IAppState } from 'renderer/reducers'
import { getPlaybackTime2 } from 'renderer/lobby/reducers/mediaPlayer.helpers'
import { isHost } from 'renderer/lobby/reducers/users'
const { remote, ipcRenderer } = chrome

interface IProps {
  className?: string
  theRef?: (c: _VideoPlayer | null) => void
  onInteractChange?: (interacting: boolean) => void
}

interface IConnectedProps extends IMediaPlayerState {
  mute: boolean
  volume: number
  host: boolean
}

interface IState {
  /** Webview is initializing, try to mitigate white flash */
  initializing: boolean

  interacting: boolean
}

const DEFAULT_URL = absoluteUrl('./browser/resources/idlescreen.html')

const mapStateToProps = (state: IAppState): IConnectedProps => {
  return {
    ...state.mediaPlayer,
    mute: state.settings.mute,
    volume: state.settings.volume,
    host: isHost(state)
  }
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>

class _VideoPlayer extends Component<PrivateProps, IState> {
  private webview: Electron.WebviewTag | null
  private webContents: Electron.WebContents
  private initTimeoutId?: number

  state: IState = { initializing: true, interacting: false }

  get isPlaying() {
    return this.props.playback === PlaybackState.Playing
  }

  get isPaused() {
    return this.props.playback === PlaybackState.Paused
  }

  get mediaUrl() {
    const media = this.props.current
    return media ? media.url : DEFAULT_URL
  }

  // HACK: Set http referrer to itself to avoid referral blocking
  get httpReferrer() {
    const media = this.props.current

    if (media && media.state && media.state.referrer) {
      return MEDIA_REFERRER
    }

    const { mediaUrl } = this

    try {
      const url = new URL(mediaUrl)
      return url.origin
    } catch (e) {
      return mediaUrl
    }
  }

  componentDidMount(): void {
    if (this.props.theRef) {
      this.props.theRef(this)
    }

    this.initTimeoutId = setTimeout(() => {
      this.initTimeoutId = undefined
      this.setState({ initializing: false })
    }, 500) as any
  }

  componentWillUnmount(): void {
    if (this.props.theRef) {
      this.props.theRef(null)
    }

    if (this.initTimeoutId) {
      clearTimeout(this.initTimeoutId)
    }
  }

  componentDidUpdate(prevProps: PrivateProps): void {
    const { current } = this.props
    const { current: prevMedia } = prevProps

    if (current !== prevMedia) {
      if (current && prevMedia && current.url === prevMedia.url) {
        // Force restart media if new media is the same URL
        this.onMediaReady()
      } else {
        // Update URL on webview otherwise
        this.reload()
      }
      return
    }

    if (this.props.playback !== prevProps.playback) {
      this.updatePlayback(this.props.playback)
    }

    if (
      (this.isPlaying && this.props.startTime !== prevProps.startTime) ||
      (this.isPaused && this.props.pauseTime !== prevProps.pauseTime)
    ) {
      this.updatePlaybackTime()
    }

    if (this.props.volume !== prevProps.volume || this.props.mute !== prevProps.mute) {
      this.updateVolume()
    }
  }

  private setupWebview = (webview: Electron.WebviewTag | null): void => {
    this.webview = webview

    if (this.webview) {
      this.webview.addEventListener('ipc-message', this.onIpcMessage)

      const wv = this.webview as any
      wv.addEventListener('did-attach', (e: any) => {
        ; (remote as any).getWebContents(e.tabId, (webContents: Electron.WebContents) => {
          this.webContents = webContents
          this.reload()

          const win = window as any
          win.__PLAYER_TAB_ID__ = e.tabId || -1

          if (process.env.NODE_ENV === 'development') {
            win.WEBCONTENTS = webContents
          }
        })
      })
    } else {
      this.webContents = undefined as any
    }
  }

  private dispatchMedia(type: string, payload: any) {
    ipcRenderer.send('media-action', { type, payload })
  }

  private onIpcMessage = (event: Electron.IpcMessageEvent) => {
    console.log('Received VideoPlayer IPC message', event, event.args)

    switch (event.channel) {
      case 'media-ready':
        this.onMediaReady(...event.args)
        break
      case 'media-iframes':
        this.requestFullScreenIFrame(event.args[0])
        break
    }
  }

  private onMediaReady = (info?: any) => {
    console.debug('onMediaReady', info)

    this.updatePlaybackTime()
    this.updatePlayback(this.props.playback)
    this.updateVolume()

    const media = this.props.current
    if (this.props.host) {
      const prevDuration = media ? media.duration : null
      const nextDuration = info && info.duration && !isNaN(info.duration) ? info.duration : null

      const isLiveMedia = prevDuration === 0
      const noDuration = !prevDuration
      const isLongerDuration = nextDuration && (prevDuration && nextDuration > prevDuration)

      if (nextDuration && !isLiveMedia && (noDuration || isLongerDuration)) {
        this.props.dispatch!(updateMedia(info))
        this.props.dispatch!(updatePlaybackTimer())
      }
    }

    // Auto-fullscreen
    if (info) {
      if (info.iframe) {
        this.webContents.send('media-iframes', info.href)
      } else {
        // Delay to prevent embed-disabled YouTube vids from fullscreening then closing
        setTimeout(() => this.requestFullScreen(), 500)
      }
    }
  }

  private requestFullScreen(x: number = 0, y: number = 0) {
    // Insert gesture event to allow triggering fullscreen
    console.debug(`requestFullscreen x=${x} y=${y}`)
    this.webContents.sendInputEvent({ type: 'mouseMove', x: 1, y: 1, movementX: 1234 } as any)

    // Hide player controls
    this.webContents.sendInputEvent({ type: 'mouseLeave', x: 0, y: 0 } as any)
  }

  private requestFullScreenIFrame(points: { x: number; y: number }[]) {
    console.debug('FS POINTS', points)
    points.forEach((p, idx) => this.requestFullScreen(p.x, p.y))
  }

  private updatePlaybackTime = () => {
    const { current: media } = this.props

    if (media && (media.duration === 0 || typeof media.duration === 'undefined')) {
      console.debug('Preventing updating playback since duration indicates livestream')
      return // live stream
    }

    let time = getPlaybackTime2(this.props)

    if (this.webContents && typeof time === 'number') {
      console.log('Sending seek IPC message', time)
      this.dispatchMedia('seek', time)
    }
  }

  private updatePlayback = (state: PlaybackState) => {
    if (this.webContents) {
      this.dispatchMedia('playback', state)
    }
  }

  private updateVolume = () => {
    if (!this.webContents) {
      return
    }

    const { volume, mute } = this.props

    if (mute !== this.webContents.isAudioMuted()) {
      this.webContents.setAudioMuted(mute)
    }

    const newVolume = this.props.mute ? 0 : this.props.volume
    this.dispatchMedia('volume', this.scaleVolume(newVolume))
  }

  /**
   * Use dB scale to convert linear volume to exponential.
   * https://www.dr-lex.be/info-stuff/volumecontrols.html
   */
  private scaleVolume(volume: number): number {
    return clamp(Math.exp(6.908 * volume) / 1000, 0, 1)
  }

  render(): JSX.Element | null {
    return (
      <div
        className={cx(styles.container, this.props.className)}
        onDoubleClick={this.enterInteractMode}
      >
        {this.renderBrowser()}
        {!this.state.interacting ? (
          <div className={styles.interactTrigger} onDoubleClick={this.enterInteractMode} />
        ) : null}
        {this.state.interacting ? (
          <div className={styles.interactNotice}>Interact ON. Press Esc to cancel.</div>
        ) : null}
      </div>
    )
  }

  private renderBrowser(): JSX.Element {
    // TODO: Remove `is` attribute from webview when React 16 is out
    // https://stackoverflow.com/a/33860892/1490006
    return (
      <webview
        is="is"
        ref={this.setupWebview}
        src={DEFAULT_URL}
        class={cx(styles.video, {
          [styles.loading]: this.state.initializing,
          [styles.interactive]: this.state.interacting
        })}
        plugins="true"
        partition={WEBVIEW_PARTITION}
      />
    )
  }

  reload(): void {
    // Sometimes loadURL won't work if media is still playing
    // This happens with mixcloud.com
    // this.updatePlayback(PlaybackState.Paused);

    if (this.webContents) {
      this.webContents.loadURL(this.mediaUrl, { httpReferrer: this.httpReferrer })
    }

    ipcRenderer.send('media-cleanup')
  }

  debug(): void {
    if (this.webContents && !this.webContents.isDevToolsOpened()) {
      this.webContents.openDevTools()
    }
  }

  private enterInteractMode = () => {
    this.setState({ interacting: true }, () => {
      document.addEventListener('keydown', this.onKeyDown, false)
      this.dispatchMedia('interact', true)
      if (this.props.onInteractChange) {
        this.props.onInteractChange(this.state.interacting)
      }
    })
  }

  private exitInteractMode() {
    document.removeEventListener('keydown', this.onKeyDown, false)
    this.dispatchMedia('interact', false)
    this.setState({ interacting: false }, () => {
      if (this.props.onInteractChange) {
        this.props.onInteractChange(this.state.interacting)
      }
    })
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'Escape':
        this.exitInteractMode()
        return
    }
  }
}

export type VideoPlayer = _VideoPlayer
export const VideoPlayer = connect<{}, {}, IProps>(mapStateToProps)(
  _VideoPlayer
) as React.ComponentClass<IProps>
