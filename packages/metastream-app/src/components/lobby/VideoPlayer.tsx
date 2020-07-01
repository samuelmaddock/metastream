import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { throttle, debounce } from 'lodash-es'
import styles from './VideoPlayer.css'
import { PlaybackState, IMediaPlayerState } from 'lobby/reducers/mediaPlayer'
import {
  updateMedia,
  updatePlaybackTimer,
  server_requestSeek,
  server_requestPlayPause,
  server_requestSetPlaybackRate
} from 'lobby/actions/mediaPlayer'
import { clamp } from 'utils/math'
import { MEDIA_REFERRER, MEDIA_SESSION_USER_AGENT } from 'constants/http'
import { assetUrl } from 'utils/appUrl'
import { IAppState } from 'reducers'
import { getPlaybackTime2 } from 'lobby/reducers/mediaPlayer.helpers'
import { isHost } from 'lobby/reducers/users.helpers'
import { isEqual } from 'lodash-es'
import { IReactReduxProps } from 'types/redux-thunk'
import { Webview } from 'components/Webview'
import { ExtensionInstall } from './overlays/ExtensionInstall'
import { Icon } from '../Icon'
import { addChat } from '../../lobby/actions/chat'
import { MediaSession } from './MediaSession'
import { getPlayerSettings, PlayerSettings } from '../../reducers/settings'
import { SafeBrowse } from 'services/safeBrowse'
import { SafeBrowsePrompt } from './overlays/SafeBrowsePrompt'
import { localUserId } from 'network'
import { setPopupPlayer } from 'actions/ui'
import { StorageKey } from 'constants/storage'
import { EMBED_BLOCKED_DOMAIN_LIST } from 'constants/embed'
import { IdleScreen } from './overlays/IdleScreen'
import { setVolume } from 'actions/settings'

type MediaReadyPayload = {
  duration?: number
  href: string
}

const processMediaDuration = (duration?: number, prevDuration?: number) => {
  duration = duration && !isNaN(duration) ? duration : undefined
  if (!duration) return

  // Hulu and Crunchyroll display videos only a few seconds long prior to
  // showing a full video. To avoid the issue of prematuring ending videos,
  // we just set a minimum duration.
  if (typeof prevDuration !== 'number') {
    duration = Math.max(duration, MEDIA_DURATION_MIN) || MEDIA_DURATION_MIN
  }

  return duration
}

interface IProps {
  className?: string
  theRef?: (c: _VideoPlayer | null) => void
  onInteractChange?: (interacting: boolean) => void
}

interface IConnectedProps extends IMediaPlayerState {
  mute: boolean
  volume: number
  host: boolean
  isExtensionInstalled: boolean
  playerSettings: PlayerSettings
  safeBrowseEnabled: boolean
  popupPlayer?: boolean
}

interface IState {
  interacting: boolean
  mediaReady: boolean
  permitURLOnce: boolean
}

const DEFAULT_URL = assetUrl('idlescreen.html')
const MEDIA_TIMEOUT_DURATION = 10e3
const MEDIA_DURATION_MIN = 10e3

const mapStateToProps = (state: IAppState): IConnectedProps => {
  return {
    ...state.mediaPlayer,
    mute: state.settings.mute,
    volume: state.settings.volume,
    host: isHost(state),
    isExtensionInstalled: state.ui.isExtensionInstalled,
    playerSettings: getPlayerSettings(state),
    safeBrowseEnabled: state.settings.safeBrowse,
    popupPlayer: state.ui.popupPlayer
  }
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

class _VideoPlayer extends PureComponent<PrivateProps, IState> {
  private webview: Webview | null = null
  private mediaTimeout?: number

  /** Last time any activity occurred within the media frame. */
  private lastActivityTime: number = 0

  /** Last time the user interacted within the media frame. */
  private lastInteractTime: number = 0

  private lastPlaybackPause: number = 0

  state: IState = { interacting: false, mediaReady: false, permitURLOnce: false }

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

  private get isPermittedBySafeBrowse() {
    const media = this.props.current

    // Always playback self-requested media
    if (media && media.ownerId === localUserId()) {
      return true
    }

    return this.props.safeBrowseEnabled
      ? this.state.permitURLOnce || SafeBrowse.getInstance().isPermittedURL(this.mediaUrl)
      : true
  }

  private get canEnterInteractMode() {
    if (!this.props.isExtensionInstalled) return false
    if (!this.isPermittedBySafeBrowse) return false
    if (this.shouldRenderPopup) return false
    if (this.props.playback === PlaybackState.Idle) return false
    return true
  }

  private get canEmbed(): boolean {
    let url
    try {
      url = new URL(this.mediaUrl)
    } catch {
      return true
    }

    const isEmbedBlocked = EMBED_BLOCKED_DOMAIN_LIST.has(url.host)

    // can't embed http inside of https
    const isMixedContent = url.protocol === 'http:'

    return !(isEmbedBlocked || isMixedContent)
  }

  private get shouldRenderPopup(): boolean {
    return this.props.popupPlayer || !this.canEmbed
  }

  componentDidMount(): void {
    if (this.props.theRef) {
      this.props.theRef(this)
    }
  }

  componentWillUnmount(): void {
    if (this.props.theRef) {
      this.props.theRef(null)
    }

    if (this.mediaTimeout) {
      clearTimeout(this.mediaTimeout)
    }

    this.props.dispatch(updatePlaybackTimer())

    this.onMediaPlaybackChange.cancel()
    this.onMediaSeek.cancel()
    this.onMediaVolumeChange.cancel()
    this.onMediaPlaybackRateChange.cancel()
  }

  componentDidUpdate(prevProps: PrivateProps): void {
    const { current, playerSettings } = this.props
    const { current: prevMedia } = prevProps

    const didInstallExtension = this.props.isExtensionInstalled !== prevProps.isExtensionInstalled
    if (didInstallExtension) {
      this.reload()
      return
    }

    if (playerSettings !== prevProps.playerSettings) {
      this.dispatchMedia('set-settings', playerSettings)
    }

    if (current !== prevMedia) {
      if (isEqual(current, prevMedia)) {
        // Ignore: new object, same properties
      } else if (current && prevMedia && current.url === prevMedia.url && this.state.mediaReady) {
        // Force restart media if new media is the same URL
        this.onMediaReady()
        return
      } else {
        // Update URL on webview otherwise
        if (this.state.permitURLOnce) this.setState({ permitURLOnce: false })
        this.reload()
        return
      }
    }

    const didVolumeUpdate =
      this.props.volume !== prevProps.volume || this.props.mute !== prevProps.mute

    const didPlaybackUpdate = this.props.playback !== prevProps.playback
    const didPause = didPlaybackUpdate && this.props.playback === PlaybackState.Paused

    const didPlaybackTimeUpdate =
      (this.isPlaying && this.props.startTime !== prevProps.startTime) ||
      (this.isPaused && this.props.pauseTime !== prevProps.pauseTime)

    const didPlaybackRateUpdate = this.props.playbackRate !== prevProps.playbackRate

    if (didVolumeUpdate) this.updateVolume()

    // Update playback time if we didn't pause
    // Pause+seek causes issues for some video players where they trigger
    // starting playback after seeking
    if (didPlaybackTimeUpdate && !didPause) this.updatePlaybackTime()

    if (didPlaybackUpdate) this.updatePlayback(this.props.playback)

    if (didPlaybackRateUpdate) this.updatePlaybackRate(this.props.playbackRate)
  }

  private setupWebview = (webview: Webview | null): void => {
    const prevWebview = this.webview
    this.webview = webview

    if (prevWebview) {
      prevWebview.removeEventListener('message', this.onIpcMessage)
      prevWebview.removeEventListener('ready', this.reload)
    }
    if (this.webview) {
      this.webview.addEventListener('message', this.onIpcMessage)
      this.webview.addEventListener('ready', this.reload)
    }
  }

  private dispatchMedia(type: string, payload: any) {
    if (this.webview) {
      this.webview.dispatchRemoteEvent(
        'metastream-host-event',
        { type, payload },
        { allFrames: true }
      )
    }
  }

  private onIpcMessage = (action: any, ...args: any[]) => {
    if (typeof action !== 'object' || action === null) return
    console.debug('VideoPlayer IPC', action)
    const isTopSubFrame = !!args[0]

    // Time since last activity in the frame. Used to ignore events that happen
    // not on the user's behalf.
    const activityTimeDelta = Date.now() - this.lastActivityTime
    const interactTimeDelta = Date.now() - this.lastInteractTime

    switch (action.type) {
      case 'media-ready':
        this.onMediaReady(isTopSubFrame, action.payload)
        break
      case 'media-autoplay-error':
        this.onAutoplayError(action.payload.error)
        break
      case 'media-playback-change':
        // Need to react only to user interaction to prevent infinite loop
        // of play/pause
        if (interactTimeDelta <= 1000) {
          this.onMediaPlaybackChange(action.payload)
        }
        break
      case 'media-seeked':
        if (interactTimeDelta <= 5000) {
          this.onMediaSeek(action.payload)
        }
        break
      case 'media-volume-change':
        if (activityTimeDelta <= 1000) {
          this.onMediaVolumeChange(action.payload.value)
        } else {
          // overwrite changes to volume update outside of user interacting
          this.updateVolume()
        }
        break
      case 'media-playback-rate-change':
        this.onMediaPlaybackRateChange(action.payload.value)
        break
    }
  }

  private onMediaPlaybackChange = throttle(
    (event: { state: 'playing' | 'paused'; time: number; isTrusted: boolean }) => {
      if (this.isPlaying && event.state === 'paused') {
        this.props.dispatch(server_requestPlayPause())
        this.lastPlaybackPause = Date.now()
      } else if (this.isPaused && event.state === 'playing') {
        this.props.dispatch(server_requestPlayPause())
      }
    },
    200,
    { leading: true, trailing: true }
  )

  private onMediaSeek = throttle(
    (time: number) => {
      this.props.dispatch(server_requestSeek(time))

      // Resume playback if player paused prior to seek
      if (this.isPaused && Date.now() - this.lastPlaybackPause < 500) {
        this.props.dispatch(server_requestPlayPause())
      }
    },
    500,
    { leading: true, trailing: true }
  )

  private onMediaVolumeChange = debounce((volume: number) => {
    this.props.dispatch(setVolume(this.unscaleVolume(volume)))
  }, 200)

  private onMediaPlaybackRateChange = throttle(
    (playbackRate: number) => {
      // ignore invalid sent when video is loading
      if (playbackRate <= 0) return

      this.props.dispatch(server_requestSetPlaybackRate(playbackRate))
    },
    200,
    { leading: true, trailing: true }
  )

  private onMediaReady = (isTopSubFrame: boolean = false, payload?: MediaReadyPayload) => {
    console.debug('onMediaReady', payload)

    if (!this.state.mediaReady) {
      this.setState({ mediaReady: true })
    }

    if (this.mediaTimeout) {
      clearTimeout(this.mediaTimeout)
      this.mediaTimeout = -1
    }

    this.dispatchMedia('set-settings', this.props.playerSettings)

    // Apply auto-fullscreen to all subframes with nested iframes
    const isValidFrameSender = !isTopSubFrame || this.shouldRenderPopup
    if (isValidFrameSender && payload) {
      this.dispatchMedia('apply-fullscreen', payload.href)
    }

    this.updateVolume()
    this.updatePlaybackTime()
    this.updatePlaybackRate(this.props.playbackRate)
    this.updatePlayback(this.props.playback)

    const media = this.props.current
    if (this.props.host) {
      const prevDuration = media ? media.duration : undefined
      const nextDuration = processMediaDuration(payload && payload.duration, prevDuration)

      const isLiveMedia = prevDuration === 0
      const noDuration = !prevDuration
      const isLongerDuration = nextDuration && (prevDuration && nextDuration > prevDuration)

      if (nextDuration && !isLiveMedia && (noDuration || isLongerDuration)) {
        this.props.dispatch(updateMedia({ duration: nextDuration }))
        this.props.dispatch(updatePlaybackTimer())
      }
    }
  }

  private onMediaTimeout = () => {
    // Ignore idlescreen timeout
    if (this.props.playback === PlaybackState.Idle) return

    const hasInteracted = Boolean(localStorage.getItem(StorageKey.HasInteracted))
    if (hasInteracted) return

    const content =
      '⚠️ Playback not detected. If media doesn’t autoplay, you may need to interact with the webpage by double-clicking the screen.'
    this.props.dispatch(addChat({ content, timestamp: Date.now() }))
  }

  private onAutoplayError = (error: string) => {
    if (error !== 'NotAllowedError') return

    const hasShownNotice = Boolean(sessionStorage.getItem(StorageKey.AutoplayNotice))
    if (hasShownNotice) return

    const content =
      '⚠️ Autoplay permissions are blocked. Enable autoplay in your browser for a smoother playback experience. Reload the video if it doesn’t start.'
    this.props.dispatch(addChat({ content, timestamp: Date.now() }))

    try {
      sessionStorage.setItem(StorageKey.AutoplayNotice, '1')
    } catch {}
  }

  private updatePlaybackTime = () => {
    const { current: media } = this.props

    if (media && media.duration === 0) {
      console.debug('Preventing updating playback since duration indicates livestream')
      return // live stream
    }

    let time = getPlaybackTime2(this.props)

    if (typeof time === 'number') {
      this.dispatchMedia('seek-media', time)
    }
  }

  private updatePlayback = (state: PlaybackState) => {
    this.dispatchMedia('set-media-playback', state)
  }

  private updatePlaybackRate = (playbackRate: number) => {
    this.dispatchMedia('set-media-playback-rate', playbackRate)
  }

  private updateVolume = () => {
    const { volume, mute } = this.props

    const newVolume = mute ? 0 : volume
    this.dispatchMedia('set-media-volume', this.scaleVolume(newVolume))
  }

  /**
   * Use dB scale to convert linear volume to exponential.
   * https://www.dr-lex.be/info-stuff/volumecontrols.html
   */
  private scaleVolume(volume: number): number {
    return volume === 0 ? 0 : clamp(Math.exp(6.908 * volume) / 1000, 0, 1)
  }

  /** Convert exponential volume into linear. */
  private unscaleVolume(volume: number): number {
    return volume === 0 ? 0 : clamp(Math.log(volume * 1000) / 6.908, 0, 1)
  }

  render(): JSX.Element | null {
    return (
      <div
        className={cx(styles.container, this.props.className)}
        onDoubleClick={this.enterInteractMode}
      >
        {this.renderMediaSession()}
        {this.renderInteract()}
        {this.renderBrowser()}
        {this.props.playback === PlaybackState.Idle && this.renderIdleScreen()}
      </div>
    )
  }

  private renderMediaSession() {
    if (!('mediaSession' in navigator)) return
    return (
      <MediaSession
        playing={this.props.playback === PlaybackState.Playing}
        muted={this.props.mute || this.props.volume === 0}
      />
    )
  }

  private renderBrowser() {
    const { mediaUrl } = this
    const { current: media } = this.props

    if (!this.props.isExtensionInstalled) {
      return <ExtensionInstall />
    }

    if (!this.isPermittedBySafeBrowse) {
      return (
        <SafeBrowsePrompt
          url={mediaUrl}
          onChange={() => this.forceUpdate()}
          onPermitOnce={() => {
            this.setState({ permitURLOnce: true })
          }}
        />
      )
    }

    return (
      <Webview
        componentRef={this.setupWebview}
        src={DEFAULT_URL}
        mediaSrc={this.mediaUrl}
        className={cx(styles.video, {
          [styles.interactive]: this.state.interacting,
          [styles.playing]: !!this.props.current,
          [styles.mediaReady]: this.state.mediaReady
        })}
        allowScripts
        popup={this.shouldRenderPopup}
        onClosePopup={() => {
          if (this.props.popupPlayer) {
            this.props.dispatch(setPopupPlayer(false))
          }
        }}
        backgroundImage={(media && media.imageUrl) || undefined}
        onActivity={this.onActivity}
      />
    )
  }

  private renderIdleScreen() {
    if (!this.props.isExtensionInstalled || this.shouldRenderPopup) return
    return <IdleScreen />
  }

  private onActivity = (eventName: string) => {
    this.lastActivityTime = Date.now()

    if (eventName !== 'mousemove') {
      this.lastInteractTime = Date.now()
    }
  }

  private renderInteract = () => {
    if (!this.canEnterInteractMode) return

    const msg = this.props.host
      ? '⚠️ Interact mode enabled. Only playback changes will be synced. ⚠️'
      : '⚠️ Interact mode enabled. Changes will only affect your local web browser. ⚠️'

    return this.state.interacting ? (
      <button className={styles.interactNotice} onClick={this.exitInteractMode}>
        {msg}
        <Icon name="x" pointerEvents="none" className={styles.btnExitInteract} />
      </button>
    ) : (
      <div className={styles.interactTrigger} onDoubleClick={this.enterInteractMode} />
    )
  }

  reload = () => {
    // Pause media to prevent continued playback in case next media takes time to load
    this.updatePlayback(PlaybackState.Paused)

    this.setState({ mediaReady: false })

    if (this.mediaTimeout) clearTimeout(this.mediaTimeout)
    this.mediaTimeout = setTimeout(this.onMediaTimeout, MEDIA_TIMEOUT_DURATION) as any

    if (this.webview) {
      this.webview.loadURL(this.mediaUrl, {
        httpReferrer: this.httpReferrer,
        userAgent: MEDIA_SESSION_USER_AGENT
      })
    }
  }

  enterInteractMode = () => {
    if (!this.canEnterInteractMode) return

    this.setState({ interacting: true }, () => {
      document.addEventListener('keydown', this.onKeyDown, false)
      this.dispatchMedia('set-interact', true)
      if (this.props.onInteractChange) {
        this.props.onInteractChange(this.state.interacting)
      }
    })

    try {
      localStorage.setItem(StorageKey.HasInteracted, '1')
    } catch {}
  }

  exitInteractMode = () => {
    document.removeEventListener('keydown', this.onKeyDown, false)
    this.dispatchMedia('set-interact', false)
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
export const VideoPlayer = connect(mapStateToProps)(_VideoPlayer)
