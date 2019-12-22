import shortid from 'shortid'
import { StorageKey } from 'constants/storage'
import { isIP } from 'utils/network'
import { getUserName } from 'lobby/reducers/users.helpers'
import { t } from 'locale'
import { AppThunkAction } from 'types/redux-thunk'
import {
  hasPlaybackPermissions,
  getMediaById,
  getCurrentMedia
} from 'lobby/reducers/mediaPlayer.helpers'
import { addChat } from './chat'
import { RpcThunk } from 'lobby/types'
import { getMediaParser } from './media-common'
import { IMediaItem } from 'lobby/reducers/mediaPlayer'
import { MediaThumbnailSize } from 'media/types'
import { enqueueMedia, nextMedia } from './mediaPlayer'
import { rpc, RpcRealm } from 'network/middleware/rpc'
import { MediaRequestErrorCode, MediaRequestError } from 'media/error'

interface MediaRequestOptions {
  url: string
  time?: number
  /** Whether the media should be played immediately rather than queued. */
  immediate?: boolean
}

type MediaRequestResponse =
  | {
      ok: true
      id: string
    }
  | {
      ok: false
      err: MediaRequestErrorCode
    }

export interface ClientMediaRequestOptions extends MediaRequestOptions {
  source: string
}

export const sendMediaRequest = (opts: ClientMediaRequestOptions): AppThunkAction => {
  return async (dispatch, getState) => {
    let state = getState()
    if (state.mediaPlayer.queueLocked && !hasPlaybackPermissions(state)) {
      return null
    }

    const { source, ...serverOpts } = opts
    const requestPromise = dispatch(server_requestMedia(serverOpts))

    const requestCount = parseInt(localStorage.getItem(StorageKey.RequestCount) || '0', 10) || 0
    localStorage.setItem(StorageKey.RequestCount, `${requestCount + 1}`)

    {
      ga('event', { ec: 'session', ea: 'request_media', el: source })

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

    const mediaResponse = await requestPromise

    if (!mediaResponse.ok) {
      let content

      switch (mediaResponse.err) {
        default:
          content = t('noticeMediaError', { url: opts.url })
      }

      dispatch(addChat({ content, html: true, timestamp: Date.now() }))
      return
    }

    const { id: mediaId } = mediaResponse

    state = getState()
    const media = getMediaById(state, mediaId)
    if (media && media !== getCurrentMedia(state)) {
      const content = t('noticeAddedMedia', { mediaId: media.id, mediaTitle: media.title })
      dispatch(addChat({ content, html: true, timestamp: Date.now() }))
    } else {
      console.error(`Received media request success, but couldn't find media for ${mediaId}`)
    }
  }
}

const requestMedia = (opts: MediaRequestOptions): RpcThunk<Promise<MediaRequestResponse>> => async (
  dispatch,
  getState,
  context
) => {
  const { url } = opts
  console.info('Media request', opts, context)

  const state = getState()
  if (state.mediaPlayer.queueLocked && !hasPlaybackPermissions(state, context.client))
    return { ok: false, err: MediaRequestErrorCode.NotAllowed }
  if (opts.immediate && !hasPlaybackPermissions(state, context.client))
    return { ok: false, err: MediaRequestErrorCode.NotAllowed }

  let res

  try {
    const mediaParser = await getMediaParser()
    res = await mediaParser.resolveMediaUrl(url)
  } catch (e) {
    console.error(e)
  }

  if (!res) {
    console.log(`Failed to fetch media for ${url}`)
    return { ok: false, err: MediaRequestErrorCode.Generic }
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
    hasMore: res.hasMore,
    startTime: opts.time && res.duration && opts.time < res.duration ? opts.time : undefined
  }

  if (res.state) {
    media.state = res.state
  }

  if (opts.immediate) {
    const queued = (dispatch(enqueueMedia(media, 0)) as any) as boolean
    if (queued) dispatch(nextMedia(true))
  } else {
    dispatch(enqueueMedia(media))
  }

  return { ok: true, id: media.id }
}
const server_requestMedia = rpc('requestMedia', RpcRealm.Server, requestMedia)
