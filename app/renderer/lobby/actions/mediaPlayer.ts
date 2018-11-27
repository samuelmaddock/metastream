import { actionCreator } from 'utils/redux'
import shortid from 'shortid'
import { IMediaItem, PlaybackState } from 'renderer/lobby/reducers/mediaPlayer'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { RpcThunk } from 'renderer/lobby/types'
import { resolveMediaUrl, resolveMediaPlaylist } from 'renderer/media'
import { MediaThumbnailSize } from 'renderer/media/types'
import {
  getCurrentMedia,
  getPlaybackState,
  getPlaybackTime,
  getCurrentMediaId,
  hasPlaybackPermissions,
  getMediaById
} from 'renderer/lobby/reducers/mediaPlayer.helpers'
import { getUserName, getNumUsers } from 'renderer/lobby/reducers/users.helpers'
import { addChat } from './chat'
import { AppThunkAction } from 'types/redux-thunk'
import { translateEscaped, t } from 'locale'

export const playPauseMedia = actionCreator<number>('PLAY_PAUSE_MEDIA')
export const repeatMedia = actionCreator<number>('REPEAT_MEDIA')
export const seekMedia = actionCreator<number>('SEEK_MEDIA')
export const setMedia = actionCreator<IMediaItem>('SET_MEDIA')
export const endMedia = actionCreator<void>('END_MEDIA')
export const queueMedia = actionCreator<IMediaItem>('QUEUE_MEDIA')
export const updateMedia = actionCreator<{ duration: number }>('UPDATE_MEDIA')
export const deleteMedia = actionCreator<string>('DELETE_MEDIA')
export const moveToTop = actionCreator<string>('MOVE_MEDIA_TO_TOP')
export const lockQueue = actionCreator<void>('LOCK_QUEUE')
export const updateServerClockSkew = actionCreator<number>('UPDATE_SERVER_CLOCK_SKEW')

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
        dispatch(endMedia())
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
      res = await resolveMediaPlaylist(playlist)
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
    mediaTitle: media.title
  })
  dispatch(addChat({ content, html: true, timestamp: Date.now() }))
}
export const multi_announceMediaChange = rpc(RpcRealm.Multicast, announceMediaChange)

const enqueueMedia = (media: IMediaItem): AppThunkAction => {
  return (dispatch, getState) => {
    const state = getState()
    const current = getCurrentMedia(state)

    if (current) {
      dispatch(queueMedia(media))
    } else {
      dispatch(setMedia(media))
      dispatch(updatePlaybackTimer())
      dispatch(multi_announceMediaChange(media.id))
    }
  }
}

export const sendMediaRequest = (url: string, source: string): AppThunkAction => {
  return async (dispatch, getState) => {
    let state = getState()
    if (state.mediaPlayer.queueLocked && !hasPlaybackPermissions(state)) {
      return null
    }

    const requestPromise = dispatch(server_requestMedia(url))

    const requestCount = parseInt(localStorage.getItem('requestCount') || '0', 10) || 0
    localStorage.setItem('requestCount', `${requestCount + 1}`)

    ga('event', { ec: 'session', ea: 'request_media', el: source })

    const mediaId = await requestPromise

    if (mediaId) {
      state = getState()
      const media = getMediaById(state, mediaId)
      if (media && media !== getCurrentMedia(state)) {
        const content = t('noticeAddedMedia', { mediaTitle: media.title })
        dispatch(addChat({ content, html: true, timestamp: Date.now() }))
      }
    } else {
      const content = t('noticeMediaError', { url })
      dispatch(addChat({ content, html: true, timestamp: Date.now() }))
    }
  }
}

const requestMedia = (url: string): RpcThunk<Promise<string | null>> => async (
  dispatch,
  getState,
  context
) => {
  const state = getState()
  if (state.mediaPlayer.queueLocked && !hasPlaybackPermissions(state, context.client)) {
    return null
  }

  console.info('Media request', url, context)

  let res

  try {
    res = await resolveMediaUrl(url)
  } catch (e) {
    console.error(e)
  }

  if (!res) {
    console.log(`Failed to fetch media for ${url}`)
    return null
  }

  console.log('Media response', res)

  const userId = context.client.id.toString()
  const media: IMediaItem = {
    id: shortid(),
    type: res.type,
    url: res.url,
    title: res.title || res.url,
    duration: res.duration,
    description: res.description,
    imageUrl: res.thumbnails && res.thumbnails[MediaThumbnailSize.Default],
    requestUrl: url,
    ownerId: userId,
    ownerName: getUserName(getState(), userId),
    hasMore: res.hasMore
  }

  if (res.state) {
    media.state = res.state
  }

  dispatch(enqueueMedia(media))

  return media.id
}
const server_requestMedia = rpc(RpcRealm.Server, requestMedia)

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
export const server_requestPlayPause = rpc(RpcRealm.Server, requestPlayPause)

const requestNextMedia = (): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return
  dispatch(nextMedia())
}
export const server_requestNextMedia = rpc(RpcRealm.Server, requestNextMedia)

const requestRepeatMedia = (): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return
  dispatch(repeatMedia())
}
export const server_requestRepeatMedia = rpc(RpcRealm.Server, requestRepeatMedia)

const requestSeek = (time: number): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return

  const state = getState()
  const media = getCurrentMedia(state)

  if (!media || !media.duration) {
    return
  }

  if (time < 0 || time > media.duration) {
    return
  }

  dispatch(seekMedia(time))
  dispatch(updatePlaybackTimer())
}
export const server_requestSeek = rpc(RpcRealm.Server, requestSeek)

const requestDeleteMedia = (mediaId: string): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return

  const currentId = getCurrentMediaId(getState())
  if (currentId === mediaId) {
    dispatch(nextMedia(true))
    return
  }

  dispatch(deleteMedia(mediaId))
}
export const server_requestDeleteMedia = rpc(RpcRealm.Server, requestDeleteMedia)

const requestMoveToTop = (mediaId: string): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return
  dispatch(moveToTop(mediaId))
}
export const server_requestMoveToTop = rpc(RpcRealm.Server, requestMoveToTop)

const requestToggleQueueLock = (): RpcThunk<void> => (dispatch, getState, context) => {
  if (!hasPlaybackPermissions(getState(), context.client)) return
  dispatch(lockQueue())
}
export const server_requestToggleQueueLock = rpc(RpcRealm.Server, requestToggleQueueLock)
