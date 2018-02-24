import { IAppState } from 'renderer/reducers'
import { PlaybackState } from 'renderer/lobby/reducers/mediaPlayer'

export const getCurrentMedia = (state: IAppState) => {
  return state.mediaPlayer.current
}

export const getPlaybackState = (state: IAppState) => {
  return state.mediaPlayer.playback
}

export const getPlaybackTime = (state: IAppState) => {
  const current = getCurrentMedia(state)
  const playback = getPlaybackState(state)
  const startTime = state.mediaPlayer.startTime
  const dt = state.mediaPlayer.serverTimeDelta

  switch (playback) {
    case PlaybackState.Playing:
      const curTime = Date.now() + dt - startTime!
      return curTime
    case PlaybackState.Paused:
      return state.mediaPlayer.pauseTime
  }

  return -1
}

export const getMediaQueue = (state: IAppState) => {
  return state.mediaPlayer.queue
}
