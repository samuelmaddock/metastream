import { actionCreator } from 'utils/redux'
import shortid from 'shortid'
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
import { getUserName, getNumUsers } from 'lobby/reducers/users.helpers'
import { addChat } from './chat'
import { AppThunkAction } from 'types/redux-thunk'
import { translateEscaped, t } from 'locale'
import { StorageKey } from 'constants/storage'
import { isIP } from 'utils/network'
import { clamp } from 'utils/math'

/** Code-split media parsing due to large dependencies and it's only used by the host. */
const getMediaParser = () => import(/* webpackChunkName: "media-parser" */ 'media')

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

export interface ClientMediaRequestOptions {
  url: string
  source: string
  time?: number
}

export const sendMediaRequest = (opts: ClientMediaRequestOptions): AppThunkAction => {
  return async (dispatch, getState) => {
    let state = getState()
    if (state.mediaPlayer.queueLocked && !hasPlaybackPermissions(state)) {
      return null
    }

    const requestPromise = dispatch(server_requestMedia({ url: opts.url, time: opts.time }))

    const requestCount = parseInt(localStorage.getItem(StorageKey.RequestCount) || '0', 10) || 0
    localStorage.setItem(StorageKey.RequestCount, `${requestCount + 1}`)

    {
      ga('event', { ec: 'session', ea: 'request_media', el: opts.source })

      let host
      try {
        const urlObj = new URL(opts.url)
        host = urlObj.host
        if (isIP(host)) {
          host = 'ipaddress'
        }
      } catch {}

      // Track request domain host (e.g. www.youtube.com)
      if (host) {
        ga('event', { ec: 'session', ea: 'request_host', el: host })
      }
    }

    const mediaId = await requestPromise

    if (mediaId) {
      state = getState()
      const media = getMediaById(state, mediaId)
      if (media && media !== getCurrentMedia(state)) {
        const content = t('noticeAddedMedia', { mediaId: media.id, mediaTitle: media.title })
        dispatch(addChat({ content, html: true, timestamp: Date.now() }))
      }
    } else {
      const content = t('noticeMediaError', { url: opts.url })
      dispatch(addChat({ content, html: true, timestamp: Date.now() }))
    }
  }
}

interface ServerMediaRequestOptions {
  url: string
  time?: number
}

const requestMedia = (opts: ServerMediaRequestOptions): RpcThunk<Promise<string | null>> => async (
  dispatch,
  getState,
  context
) => {
  const state = getState()
  if (state.mediaPlayer.queueLocked && !hasPlaybackPermissions(state, context.client)) {
    return null
  }

  const { url } = opts
  console.info('Media request', url, context)

  let res

  try {
    const mediaParser = await getMediaParser()
    res = await mediaParser.resolveMediaUrl(url)
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
    title: res.title || url,
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
const server_requestMedia = rpc('requestMedia', RpcRealm.Server, requestMedia)

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
