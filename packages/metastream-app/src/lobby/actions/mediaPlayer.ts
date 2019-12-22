import { actionCreator } from 'utils/redux'
import { IMediaItem, PlaybackState, PendingMedia } from 'lobby/reducers/mediaPlayer'
import { rpc, RpcRealm } from 'network/middleware/rpc'
import { RpcThunk } from 'lobby/types'
import { MediaThumbnailSize } from 'media/types'
import {
  getCurrentMedia,
  getPlaybackState,
  getPlaybackTime,
  getCurrentMediaId,
  hasPlaybackPermissions,
  getMediaById
} from 'lobby/reducers/mediaPlayer.helpers'
import { getNumUsers } from 'lobby/reducers/users.helpers'
import { AppThunkAction } from 'types/redux-thunk'
import { translateEscaped } from 'locale'
import { clamp } from 'utils/math'
import { getMediaParser } from './media-common'
import { addChat } from './chat'

export const playPauseMedia = actionCreator<number>('PLAY_PAUSE_MEDIA')
export const repeatMedia = actionCreator<number>('REPEAT_MEDIA')
export const seekMedia = actionCreator<number>('SEEK_MEDIA')
export const setMedia = actionCreator<IMediaItem>('SET_MEDIA')
export const endMedia = actionCreator<boolean /* force */>('END_MEDIA')
export const queueMedia = actionCreator<{ media: IMediaItem; index?: number }>('QUEUE_MEDIA')
export const updateMedia = actionCreator<{ duration: number }>('UPDATE_MEDIA')
export const deleteMedia = actionCreator<string>('DELETE_MEDIA')
export const moveToTop = actionCreator<string>('MOVE_MEDIA_TO_TOP')
export const lockQueue = actionCreator<void>('LOCK_QUEUE')
export const updateServerClockSkew = actionCreator<number>('UPDATE_SERVER_CLOCK_SKEW')
export const setPendingMedia = actionCreator<PendingMedia | undefined>('SET_PENDING_MEDIA')

/** Media timer until playback ends. This assumes only one media player exists at a time.*/
let mediaTimeoutId: number | null = null

export const nextMedia = (force?: boolean): AppThunkAction => {
  return async (dispatch, getState) => {
    const state = getState()
    const media = getCurrentMedia(state)

    if (media) {
      if (!force && media.hasMore) {
        await dispatch(advanceMedia(media))
      } else {
        dispatch(endMedia(force))
        dispatch(updatePlaybackTimer())
      }
    }

    // Announce now playing media
    const current = getCurrentMedia(getState())
    if (current) {
      dispatch(multi_announceMediaChange(current.id))
    }
  }
}

const advanceMedia = (playlist: IMediaItem): AppThunkAction => {
  return async dispatch => {
    console.info('Advancing media', playlist)

    let res

    try {
      const mediaParser = await getMediaParser()
      res = await mediaParser.resolveMediaPlaylist(playlist)
    } catch (e) {
      console.error(e)
    }

    if (!res) {
      // TODO: Notify clients
      console.log(`Failed to resolve media playlist`)
      return
    }

    console.log('Media response', res)

    const media: IMediaItem = {
      ...playlist,
      type: res.type,
      url: res.url,
      title: res.title || res.url,
      duration: res.duration,
      description: res.description,
      imageUrl: res.thumbnails && res.thumbnails[MediaThumbnailSize.Default],
      hasMore: res.hasMore
    }

    if (res.state) {
      media.state = res.state
    }

    dispatch(setMedia(media))
    dispatch(updatePlaybackTimer())
  }
}

export const updatePlaybackTimer = (): AppThunkAction => {
  return (dispatch, getState) => {
    const state = getState()
    const media = getCurrentMedia(state)
    const playback = getPlaybackState(state)

    if (mediaTimeoutId) {
      clearTimeout(mediaTimeoutId)
      mediaTimeoutId = null
    }

    if (playback === PlaybackState.Playing) {
      const curTime = getPlaybackTime(state)!
      const duration = media && media.duration

      if (duration && duration > 0) {
        const elapsed = duration - curTime

        // Media end callback
        mediaTimeoutId = setTimeout(() => {
          dispatch(nextMedia())
        }, elapsed) as any
      }
    }
  }
}

const announceMediaChange = (mediaId: string): RpcThunk<void> => (dispatch, getState) => {
  if (getNumUsers(getState()) === 1) return

  const media = getMediaById(getState(), mediaId)
  if (!media) return

  const content = translateEscaped('noticeNowPlaying', {
    userId: media.ownerId,
    username: media.ownerName,
    mediaId: media.id,
    mediaTitle: media.title
  })
  dispatch(addChat({ content, html: true, timestamp: Date.now() }))
}
export const multi_announceMediaChange = rpc(
  'announceMediaChange',
  RpcRealm.Multicast,
  announceMediaChange
)

export const enqueueMedia = (media: IMediaItem, index?: number): AppThunkAction => {
  return (dispatch, getState): boolean => {
    const state = getState()
    const current = getCurrentMedia(state)
    let queued: boolean

    if (current) {
      dispatch(queueMedia({ media, index }))
      queued = true
    } else {
      dispatch(setMedia(media))
      dispatch(updatePlaybackTimer())
      dispatch(multi_announceMediaChange(media.id))
      queued = false
    }

    return queued
  }
}

const requestPlayPause = (): RpcThunk<void> => (dispatch, getState, context) => {
  const state = getState()
  if (!hasPlaybackPermissions(state, context.client)) return

  const playback = getPlaybackState(state)
  const curTime = getPlaybackTime(state)

  switch (playback) {
    case PlaybackState.Playing:
    case PlaybackState.Paused:
      dispatch(playPauseMedia(curTime))
      dispatch(updatePlaybackTimer())
      break
  }
}
export const server_requestPlayPause = rpc('requestPlayPause', RpcRealm.Server, requestPlayPause)

const requestNextMedia = (): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return
  dispatch(nextMedia())
}
export const server_requestNextMedia = rpc('requestNextMedia', RpcRealm.Server, requestNextMedia)

const requestRepeatMedia = (): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return
  dispatch(repeatMedia())
}
export const server_requestRepeatMedia = rpc(
  'requestRepeatMedia',
  RpcRealm.Server,
  requestRepeatMedia
)

const requestSeek = (time: number): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return

  const state = getState()
  const media = getCurrentMedia(state)
  if (!media || !media.duration) return

  time = clamp(time, 0, media.duration)
  if (isNaN(time)) return

  dispatch(seekMedia(time))
  dispatch(updatePlaybackTimer())
}
export const server_requestSeek = rpc('requestSeek', RpcRealm.Server, requestSeek)

const requestSeekRelative = (relativeTime: number): RpcThunk<void> => (
  dispatch,
  getState,
  context
) => {
  const curTime = getPlaybackTime(getState())
  const time = curTime + relativeTime
  requestSeek(time)(dispatch, getState, context)
}
export const server_requestSeekRelative = rpc(
  'requestSeekRelative',
  RpcRealm.Server,
  requestSeekRelative
)

const requestDeleteMedia = (mediaId: string): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return

  const currentId = getCurrentMediaId(getState())
  if (currentId === mediaId) {
    dispatch(nextMedia(true))
    return
  }

  dispatch(deleteMedia(mediaId))
}
export const server_requestDeleteMedia = rpc(
  'requestDeleteMedia',
  RpcRealm.Server,
  requestDeleteMedia
)

const requestMoveToTop = (mediaId: string): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return
  dispatch(moveToTop(mediaId))
}
export const server_requestMoveToTop = rpc('requestMoveToTop', RpcRealm.Server, requestMoveToTop)

const requestToggleQueueLock = (): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return
  dispatch(lockQueue())
}
export const server_requestToggleQueueLock = rpc(
  'requestToggleQueueLock',
  RpcRealm.Server,
  requestToggleQueueLock
)
