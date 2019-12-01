import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import {
  setMedia,
  endMedia,
  playPauseMedia,
  seekMedia,
  queueMedia,
  repeatMedia,
  updateMedia,
  deleteMedia,
  updateServerClockSkew,
  moveToTop,
  lockQueue,
  setPendingMedia
} from 'lobby/actions/mediaPlayer'
import { MediaType } from 'media/types'
import { ReplicatedState } from '../../network/types'
import { resetLobby, initLobby } from '../actions/common'

export const enum PlaybackState {
  Idle,
  Playing,
  Paused
}

export interface IMediaItem {
  /** Unique ID */
  id: string

  type: MediaType

  url: string

  // TODO: Make the following non-optional
  title: string

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

  /** Time to start playback at. */
  startTime?: number
}

export interface PendingMedia {
  url: string
  time?: number
  source?: string
}

export const enum RepeatMode {
  Off = 0,
  On,
  One,
  /** Number of enum constants */
  Count
}

export interface IMediaPlayerState {
  playback: PlaybackState
  repeatMode: RepeatMode
  startTime?: number
  pauseTime?: number
  current?: IMediaItem
  queue: IMediaItem[]
  queueLocked: boolean

  /** Clock time difference between client and server. */
  serverClockSkew: number

  /** Local session save state. */
  localSnapshot?: IMediaPlayerState

  /** Media pending to be queued */
  pendingMedia?: PendingMedia
}

export const mediaPlayerReplicatedState: ReplicatedState<IMediaPlayerState> = {
  playback: true,
  repeatMode: true,
  startTime: true,
  pauseTime: true,
  current: true,
  queue: true,
  queueLocked: true,
  serverClockSkew: false
}

const initialState: IMediaPlayerState = {
  playback: PlaybackState.Idle,
  repeatMode: RepeatMode.Off,
  startTime: undefined, // undefined to clear out old data
  pauseTime: undefined,
  current: undefined,
  queue: [],
  queueLocked: false,
  serverClockSkew: 0
}

const getMediaStartTime = (media: IMediaItem) =>
  media.startTime ? Date.now() - media.startTime : Date.now()

export const mediaPlayer: Reducer<IMediaPlayerState> = (
  state: IMediaPlayerState = initialState,
  action: any
) => {
  if (isType(action, setMedia)) {
    const media = action.payload
    return {
      ...state,
      playback: PlaybackState.Playing,
      current: media,
      startTime: getMediaStartTime(media)
    }
  } else if (isType(action, endMedia)) {
    let next
    let queue = state.queue
    const current = state.current
    const force = action.payload

    if (current) {
      if ((force && state.repeatMode !== RepeatMode.Off) || state.repeatMode === RepeatMode.On) {
        queue = [...queue, current]
      } else if (state.repeatMode === RepeatMode.One) {
        queue = [current, ...queue]
      }
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
      startTime: next ? getMediaStartTime(next) : undefined,
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
    const { media, index } = action.payload

    const queue = [...state.queue]
    const queueIndex = typeof index === 'number' ? index : queue.length
    queue.splice(queueIndex, 0, media)

    return { ...state, queue }
  } else if (isType(action, repeatMedia)) {
    return {
      ...state,
      // cycle through repeat modes
      repeatMode: (state.repeatMode + 1) % RepeatMode.Count
    }
  } else if (isType(action, updateServerClockSkew)) {
    return { ...state, serverClockSkew: action.payload }
  } else if (isType(action, updateMedia) && state.current) {
    const prevDuration = state.current.duration
    const nextDuration = action.payload.duration

    // Reset start time if media previously had unknown duration
    const hasPrevDuration = typeof prevDuration === 'number'
    const hasNextDuration = typeof nextDuration === 'number'
    const startTime = !hasPrevDuration && hasNextDuration ? Date.now() : state.startTime

    return {
      ...state,
      startTime,
      current: {
        ...state.current,
        duration: hasNextDuration ? nextDuration : prevDuration
      }
    }
  } else if (isType(action, deleteMedia)) {
    const mediaId = action.payload
    const mediaIdx = state.queue.findIndex(media => media.id === mediaId)
    if (mediaIdx > -1) {
      const queue = [...state.queue]
      queue.splice(mediaIdx, 1)
      return { ...state, queue }
    }
  } else if (isType(action, moveToTop)) {
    const mediaId = action.payload
    const mediaIdx = state.queue.findIndex(media => media.id === mediaId)
    if (mediaIdx > -1) {
      const queue = [...state.queue]
      queue.unshift(queue.splice(mediaIdx, 1)[0])
      return { ...state, queue }
    }
  } else if (isType(action, lockQueue)) {
    return {
      ...state,
      queueLocked: !state.queueLocked
    }
  } else if (isType(action, setPendingMedia)) {
    return {
      ...state,
      pendingMedia: action.payload
    }
  }

  // Save session snapshot on disconnect
  if (isType(action, resetLobby)) {
    if (!action.payload.host) {
      return state.localSnapshot
        ? { ...initialState, localSnapshot: state.localSnapshot }
        : initialState
    }

    const isPlaying = state.playback === PlaybackState.Playing
    return {
      ...initialState,
      localSnapshot: {
        ...state,
        playback: isPlaying ? PlaybackState.Paused : state.playback,
        pauseTime: isPlaying ? Date.now() - state.startTime! : state.pauseTime
      }
    }
  }

  // Restore session snapshot
  if (isType(action, initLobby)) {
    if (action.payload.host && state.localSnapshot) {
      const { localSnapshot } = state
      return {
        ...state,
        ...initialState,
        ...localSnapshot,
        localSnapshot: undefined,
        // #227 a bug appeared where the snapshot was restored in an idle playback state with media.
        // here we force the state to be paused to ensure media can be skipped.
        playback: localSnapshot.current ? PlaybackState.Paused : PlaybackState.Idle,
        serverClockSkew: initialState.serverClockSkew
      }
    } else {
      // Clear out old state in case tab shutdown unexpectedly
      return { ...state, ...initialState }
    }
  }

  return state
}
