import { Reducer } from 'redux'
import { NetworkState } from 'types/network'
import { isType } from 'utils/redux'
import { addChat } from 'renderer/lobby/actions/chat'
import {
  setMedia,
  endMedia,
  playPauseMedia,
  seekMedia,
  queueMedia,
  repeatMedia
} from 'renderer/lobby/actions/mediaPlayer'
import { MediaType } from 'renderer/media/types'
import { NetActions } from 'renderer/network/actions'
import { updateServerTimeDelta } from 'renderer/lobby/actions/clock'

export const enum PlaybackState {
  Idle,
  Playing,
  Paused
}

export interface IMediaItem {
  type: MediaType

  url: string

  // TODO: Make the following non-optional
  title?: string

  /** Duration in ms */
  duration?: number

  /** Thumbnail image */
  imageUrl?: string

  description?: string

  /** Original request URL */
  requestUrl: string

  /** Requester ID */
  ownerId?: string

  /** Requester name, in case they disconnect */
  ownerName?: string

  /** Middleware-specific state */
  state?: { [key: string]: any }

  /** Whether the item should continue as the next media */
  hasMore?: boolean
}

export const enum RepeatMode {
  Off = 0,
  On,
  Count
}

export interface IMediaPlayerState {
  playback: PlaybackState
  repeatMode: RepeatMode
  startTime?: number
  pauseTime?: number
  current?: IMediaItem
  queue: IMediaItem[]
  serverTimeDelta: number
}

const initialState: IMediaPlayerState = {
  playback: PlaybackState.Idle,
  repeatMode: RepeatMode.Off,
  queue: [],
  serverTimeDelta: 0
}

export const mediaPlayer: Reducer<IMediaPlayerState> = (
  state: IMediaPlayerState = initialState,
  action: any
) => {
  if (isType(action, setMedia)) {
    return {
      ...state,
      playback: PlaybackState.Playing,
      current: action.payload,
      startTime: Date.now()
    }
  } else if (isType(action, endMedia)) {
    let next
    let queue = state.queue
    const current = state.current

    // recycle current media while repeat is enabled
    if (current && state.repeatMode === RepeatMode.On) {
      queue = [...queue, current]
    }

    // get next item in the queue
    if (queue.length > 0) {
      // create queue copy since `shift()` will mutate it
      queue = [...queue]
      next = queue.shift()
    }

    return {
      ...state,
      playback: next ? PlaybackState.Playing : PlaybackState.Idle,
      current: next,
      startTime: next ? Date.now() : undefined,
      queue: queue
    }
  } else if (isType(action, playPauseMedia)) {
    switch (state.playback) {
      case PlaybackState.Playing:
        return {
          ...state,
          playback: PlaybackState.Paused,
          pauseTime: action.payload
        }
      case PlaybackState.Paused:
        return {
          ...state,
          playback: PlaybackState.Playing,
          startTime: Date.now() - state.pauseTime!,
          pauseTime: undefined
        }
    }
  } else if (isType(action, seekMedia)) {
    const time = action.payload
    switch (state.playback) {
      case PlaybackState.Playing:
        return {
          ...state,
          startTime: Date.now() - time
        }
      case PlaybackState.Paused:
        return {
          ...state,
          pauseTime: time
        }
    }
  } else if (isType(action, queueMedia)) {
    return {
      ...state,
      queue: [...state.queue, action.payload]
    }
  } else if (isType(action, repeatMedia)) {
    return {
      ...state,
      // cycle through repeat modes
      repeatMode: (state.repeatMode + 1) % RepeatMode.Count
    }
  } else if (isType(action, updateServerTimeDelta)) {
    return { ...state, serverTimeDelta: action.payload }
  }

  if (isType(action, NetActions.disconnect)) {
    return initialState
  }

  return state
}
