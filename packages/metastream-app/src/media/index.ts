import { cleanObject } from 'utils/object'
import compose from './compose'

import { IMediaMiddleware, IMediaRequest, IMediaResponse, IMediaContext, MediaType } from './types'

import baseMware from './middleware/base'
import subredditMware from './middleware/subreddit'
import youTubeMware from './middleware/youtube'
import youTubePlaylistMware from './middleware/youtube-playlist'
import httpHeadMware from './middleware/httpHead'
import mediaMware from './middleware/media'
import htmlMware from './middleware/html'
import openGraphMware from './middleware/openGraph'
import oEmbedMware from './middleware/oembed'
import autoplayMware from './middleware/autoplay'
import microdataMware from './middleware/microdata'
import imgurMware from './middleware/imgur'

import { IMediaItem } from 'lobby/reducers/mediaPlayer'

// prettier-ignore
const middlewares: IMediaMiddleware[] = [
  baseMware,

  subredditMware,
  youTubePlaylistMware,

  httpHeadMware,
  mediaMware,
  htmlMware,

  youTubeMware,
  imgurMware,

  openGraphMware,
  oEmbedMware,
  microdataMware,
  autoplayMware
];

type MediaUrl = URL

const createContext = (url: MediaUrl) => {
  const req: IMediaRequest = {
    type: MediaType.Item,
    url,

    // TODO: add user info for logging middleware
    user: null
  }

  const res: IMediaResponse = {
    type: MediaType.Item,
    url: url.href,
    state: {}
  }

  const ctx: IMediaContext = {
    req,
    res,
    state: {}
  }

  return ctx
}

const finalizeMedia = (media: IMediaResponse) => {
  if (media.description) {
    const desc = media.description.trim()
    media.description = desc || undefined
  }
  return cleanObject(media)
}

export const resolveMediaUrl = async (url: string): Promise<Readonly<IMediaResponse> | null> => {
  const urlObj: MediaUrl = new URL(url)
  if (!urlObj.href) {
    return null
  }

  const ctx = createContext(urlObj)

  const fn = compose(middlewares)
  const result = (await fn(ctx)) || ctx.res
  console.debug('Resolved media', ctx)
  return finalizeMedia(result)
}

export const resolveMediaPlaylist = async (
  media: IMediaItem
): Promise<Readonly<IMediaResponse> | null> => {
  const urlObj: MediaUrl = new URL(media.url)
  if (!urlObj.href) {
    return null
  }

  const ctx = createContext(urlObj)

  // Transfer old state to new request
  ctx.req = {
    ...ctx.req,
    type: media.type,
    state: media.state
  }

  console.log('resolving playlist', ctx)

  const fn = compose(middlewares)
  const result = (await fn(ctx)) || ctx.res
  return finalizeMedia(result)
}
