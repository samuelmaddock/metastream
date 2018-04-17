import { parse as parseUrl } from 'url'
import { actionCreator } from 'utils/redux'
import shortid from 'shortid'
import { IMediaItem, PlaybackState } from 'renderer/lobby/reducers/mediaPlayer'
import { Thunk } from 'types/thunk'
import { ThunkAction } from 'redux-thunk'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { RpcThunk } from 'renderer/lobby/types'
import { PlatformService } from 'renderer/platform'
import { resolveMediaUrl, resolveMediaPlaylist } from 'renderer/media'
import { MediaThumbnailSize, MediaType } from 'renderer/media/types'
import {
  getCurrentMedia,
  getPlaybackState,
  getPlaybackTime,
  getCurrentMediaId
} from 'renderer/lobby/reducers/mediaPlayer.helpers'
import { IAppState } from 'renderer/reducers'
import { getUserName } from 'renderer/lobby/reducers/users'

export const playPauseMedia = actionCreator<number>('PLAY_PAUSE_MEDIA')
export const repeatMedia = actionCreator<number>('REPEAT_MEDIA')
export const seekMedia = actionCreator<number>('SEEK_MEDIA')
export const setMedia = actionCreator<IMediaItem>('SET_MEDIA')
export const endMedia = actionCreator<void>('END_MEDIA')
export const queueMedia = actionCreator<IMediaItem>('QUEUE_MEDIA')
export const updateMedia = actionCreator<{ duration: number }>('UPDATE_MEDIA')
export const deleteMedia = actionCreator<string>('DELETE_MEDIA')

/** Media timer until playback ends. This assumes only one media player exists at a time.*/
let mediaTimeoutId: number | null = null

export const nextMedia = (force?: boolean): ThunkAction<void, IAppState, void> => {
  return (dispatch, getState) => {
    const state = getState()
    const media = getCurrentMedia(state)

    if (media) {
      if (!force && media.hasMore) {
        return dispatch(advanceMedia(media))
      } else {
        dispatch(endMedia())
        dispatch(updatePlaybackTimer())
      }
    }
  }
}

const advanceMedia = (playlist: IMediaItem): ThunkAction<void, IAppState, void> => {
  return async (dispatch, getState) => {
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
      title: res.title,
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

export const updatePlaybackTimer = (): ThunkAction<void, IAppState, void> => {
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

const enqueueMedia = (media: IMediaItem): ThunkAction<void, IAppState, void> => {
  return (dispatch, getState) => {
    const state = getState()
    const current = getCurrentMedia(state)

    if (current) {
      dispatch(queueMedia(media))
    } else {
      dispatch(setMedia(media))
      dispatch(updatePlaybackTimer())
    }
  }
}

const requestMedia = (url: string): RpcThunk<void> => async (dispatch, getState, context) => {
  console.info('Media request', url, context)

  let res

  try {
    res = await resolveMediaUrl(url)
  } catch (e) {
    // TODO: Notify client
    console.error(`Failed to fetch media URL metadata`)
    console.error(e)
    return
  }

  if (!res) {
    console.log(`Failed to fetch media for ${url}`)
    return
  }

  console.log('Media response', res)

  const userId = context.client.id.toString()
  const media: IMediaItem = {
    id: shortid(),
    type: res.type,
    url: res.url,
    title: res.title,
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
}
export const server_requestMedia = rpc(RpcRealm.Server, requestMedia)

const requestPlayPause = (): RpcThunk<void> => (dispatch, getState, context) => {
  const state = getState()
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
  dispatch(nextMedia())
}
export const server_requestNextMedia = rpc(RpcRealm.Server, requestNextMedia)

const requestRepeatMedia = (): RpcThunk<void> => (dispatch, getState, context) => {
  dispatch(repeatMedia())
}
export const server_requestRepeatMedia = rpc(RpcRealm.Server, requestRepeatMedia)

const requestSeek = (time: number): RpcThunk<void> => (dispatch, getState, context) => {
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
  const currentId = getCurrentMediaId(getState())
  if (currentId === mediaId) {
    dispatch(nextMedia(true))
    return
  }

  dispatch(deleteMedia(mediaId))
}
export const server_requestDeleteMedia = rpc(RpcRealm.Server, requestDeleteMedia)
