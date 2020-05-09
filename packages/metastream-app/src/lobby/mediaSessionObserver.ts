import { SessionObserver } from 'lobby/middleware/session'
import { ISessionState } from 'lobby/reducers/session'
import { ISettingsState } from 'reducers/settings'
import { PlaybackState } from 'lobby/reducers/mediaPlayer'

const DEFAULT_ARTWORK = [
  { sizes: '192x192', src: '/images/icon-192.png', type: 'image/png' },
  { sizes: '512x512', src: '/images/icon-512.png', type: 'image/png' }
]

const FALLBACK_MEDIA_IMAGE = { sizes: '1x1', src: '/images/icon-192.png', type: 'image/png' }

/**
 * Observer for reflecting Metastream session info
 * to the Media Session API.
 * https://wicg.github.io/mediasession/
 */
export class MediaSessionObserver implements SessionObserver {
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
        media && playback === PlaybackState.Playing ? state.startTime || Date.now() : undefined
      const currentTime = Math.floor(
        startTimestamp ? Math.max(0, Date.now() - startTimestamp) / 1000 : 0
      )

      mediaSession.playbackState = playback === PlaybackState.Playing ? 'playing' : 'paused'

      const metadata = {
        title: media ? media.title : 'Nothing playing',
        artwork:
          media && media.thumbnail
            ? [
                FALLBACK_MEDIA_IMAGE,
                {
                  src: media.thumbnail,
                  sizes: '128x128' // placeholder since we don't know what the actual size is
                }
              ]
            : DEFAULT_ARTWORK
      }
      mediaSession.metadata = new window.MediaMetadata(metadata)

      if (typeof mediaSession.setPositionState === 'function') {
        const duration = (media && media.duration) || 0
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
