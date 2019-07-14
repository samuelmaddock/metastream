import { Action } from 'redux'
import { MetastreamMiddleware } from 'types/redux-thunk'
import {
  server_requestPlayPause,
  server_requestNextMedia,
  server_requestSeekRelative,
  server_requestSeek
} from '../actions/mediaPlayer'
import { SEC2MS } from 'utils/math'
import { isType } from '../../utils/redux'
import { initLobby, resetLobby } from '../actions/common'

export const mediaSessionMiddleware = (): MetastreamMiddleware | undefined => {
  if (!('mediaSession' in navigator)) return

  const DEFAULT_SEEK_OFFSET = 5 // seconds

  return ({ dispatch }) => {
    const { mediaSession } = navigator

    const setActionHandler = (type: string, handler: Function | null) => {
      try {
        mediaSession.setActionHandler(type, handler)
      } catch (e) {
        // Unsupported handlers throw an error
        if (process.env.NODE_ENV === 'development') {
          console.error(e)
        }
      }
    }

    const registerMediaHandlers = () => {
      const playPause = () => dispatch(server_requestPlayPause())
      setActionHandler('play', playPause)
      setActionHandler('pause', playPause)

      const nextTrack = () => dispatch(server_requestNextMedia())
      setActionHandler('nexttrack', nextTrack)

      const seekRelative = (details: any, dir: number = 1) => {
        let seekOffset = (details || {}).seekOffset || DEFAULT_SEEK_OFFSET
        seekOffset = seekOffset * dir * SEC2MS
        dispatch(server_requestSeekRelative(seekOffset))
      }
      setActionHandler('seekforward', seekRelative)
      setActionHandler('seekbackward', (details: any) => seekRelative(details, -1))

      setActionHandler('seekto', (details: any) => {
        // Not entirely sure how this works, but I'm assuming 'fastSeek' is when
        // the user is scrubbing through the playback bar.
        if (details.fastSeek) return

        const seekTime = details.seekTime * SEC2MS
        dispatch(server_requestSeek(seekTime))
      })
    }

    const unregisterMediaHandlers = () => {
      const handlers = ['play', 'pause', 'nexttrack', 'seekforward', 'seekbackward', 'seekto']
      handlers.forEach(type => setActionHandler(type, null))
    }

    return next => <A extends Action>(action: A): Action | undefined => {
      if (isType(action, initLobby)) {
        registerMediaHandlers()
      } else if (isType(action, resetLobby)) {
        unregisterMediaHandlers()
      }

      return next(<A>action)
    }
  }
}
