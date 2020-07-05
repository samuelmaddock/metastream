import { IAppState } from 'reducers'
import { PlaybackState, IMediaPlayerState } from 'lobby/reducers/mediaPlayer'
import { localUserId, NetConnection } from '../../network'
import { isAdmin, isDJ } from './users.helpers'

export const getCurrentMedia = (state: IAppState) => {
  return state.mediaPlayer.current
}

export const getCurrentMediaId = (state: IAppState) => {
  const { current } = state.mediaPlayer
  return current && current.id
}

export const getPlaybackState = (state: IAppState) => {
  return state.mediaPlayer.playback
}

export const isPlaying = (state: IAppState) => getPlaybackState(state) === PlaybackState.Playing

const calcTime = (state: IMediaPlayerState) => {
  switch (state.playback) {
    case PlaybackState.Playing:
      const deltaTime = Date.now() - (state.startTime! + state.serverClockSkew)
      const curTime = deltaTime * state.playbackRate
      return curTime
    case PlaybackState.Paused:
      return state.pauseTime!
    default:
      return -1
  }
}

export const getPlaybackTime = (state: IAppState) => calcTime(state.mediaPlayer)

/** Derive playback time from mediaPlayer state subset */
export const getPlaybackTime2 = (state: IMediaPlayerState) => calcTime(state)

export const getMediaQueue = (state: IAppState) => {
  return state.mediaPlayer.queue
}

export const getMediaById = (state: IAppState, id: string) => {
  if (getCurrentMediaId(state) === id) {
    return getCurrentMedia(state)
  }
  return state.mediaPlayer.queue.find(media => media.id === id)
}

export const hasPlaybackPermissions = (
  state: IAppState,
  id: string | NetConnection = localUserId()
) => {
  const userId = typeof id === 'object' ? id.id.toString() : id
  return isAdmin(state, userId) || isDJ(state, userId)
}
