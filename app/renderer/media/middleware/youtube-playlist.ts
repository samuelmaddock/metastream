import { Url, parse } from 'url'
import { buildUrl, encodeQueryParams } from 'utils/url'
import {
  MediaThumbnailSize,
  IMediaMiddleware,
  IMediaRequest,
  IMediaResponse,
  MediaType,
  IMediaContext
} from '../types'
import { fetchText } from 'utils/http'
import { MEDIA_REFERRER } from 'constants/http'

const URL_PATTERN = /youtu\.?be(?:.com)?/i

const mware: IMediaMiddleware = {
  match(url, ctx) {
    const isYouTube = !!URL_PATTERN.exec(url.href)
    const isPlaylist = url.searchParams.has('list')
    return (isYouTube && !isPlaylist) || Boolean(ctx.req.state && ctx.req.state.ytpl)
  },

  async resolve(ctx, next) {
    console.log('YT PLAYLIST', ctx)
    return next()
  }
}

export default mware
