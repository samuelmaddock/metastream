import { SessionObserver } from 'lobby/middleware/session'
import { ISessionState } from 'lobby/reducers/session'
import { ISettingsState } from 'reducers/settings'
import { PlaybackState } from 'lobby/reducers/mediaPlayer'

/**
 * Observer for reflecting Metastream session info
 * to the Media Session API.
 * https://wicg.github.io/mediasession/
 */
export class MediaSessionObserver implements SessionObserver {
  constructor() {
    if (!('mediaSession' in navigator)) return
    const { mediaSession } = navigator
    mediaSession.setActionHandler('play', () => {
      console.log('play')
    })
    mediaSession.setActionHandler('pause', () => {
      console.log('pause')
    })
  }

  onChange(state: ISessionState | null): void {
    // Wrap this in try/catch since the API is so new
    try {
      this.updateState(state)
    } catch (e) {
      console.error(e)
    }
  }

  updateState(state: ISessionState | null): void {
    if (!('mediaSession' in navigator)) return
    const { mediaSession } = navigator

    if (state) {
      const { media, users, playback } = state

      const startTimestamp =
        media && playback === PlaybackState.Playing
          ? Math.floor((state.startTime || Date.now()) / 1000)
          : undefined
      const currentTime = startTimestamp ? Math.max(0, Date.now() - startTimestamp) : 0

      mediaSession.playbackState = playback === PlaybackState.Playing ? 'playing' : 'paused'

      mediaSession.metadata = new window.MediaMetadata({
        title: media ? media.title : 'Nothing playing',
        artwork: media && media.thumbnail ? [{ src: media.thumbnail }] : undefined
      })

      if (typeof mediaSession.setPositionState === 'function') {
        const duration = (media && media.duration) || Number.POSITIVE_INFINITY
        mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: currentTime
        })
      }
    } else {
      mediaSession.playbackState = 'none'

      if (typeof mediaSession.setPositionState === 'function') {
        mediaSession.setPositionState(null)
      }
    }
  }
}
