import { load } from 'cheerio'
import { MediaThumbnailSize, IMediaMiddleware, IMediaResponse } from '../types'
import { fetchText } from 'utils/http'
import { Url } from 'url'
import { MEDIA_USER_AGENT } from 'constants/http'

import { parse } from './og'
import { mergeMetadata } from '../utils'

/** Bad video types to not use. */
const BAD_VIDEO_TYPES = new Set(['application/x-shockwave-flash'])

function buildHTMLMetadata(url: Url, body: string): Partial<IMediaResponse> {
  const og = parse(body, {})
  console.log('og', og)
  const { ogTitle: title, ogImage: image, ogDescription: description } = og

  const thumbnails = image
    ? {
        [MediaThumbnailSize.Default]: image
      }
    : undefined

  const meta: Partial<IMediaResponse> = {
    url: url.href!,
    title,
    thumbnails,
    description
  }

  if (og.ogVideo) {
    const type = og.ogVideo.type
    const useVideo = type ? !BAD_VIDEO_TYPES.has(type) : true
    if (useVideo) {
      meta.url = og.ogVideo.url || meta.url
    }
    if (og.ogVideo.duration) {
      meta.duration = og.ogVideo.duration * 1000
    }
  }

  return meta
}

const mware: IMediaMiddleware = {
  match({ protocol }) {
    return protocol === 'http:' || protocol === 'https:'
  },

  async resolve(ctx, next) {
    const { url } = ctx.req
    const { $, body } = ctx.state

    if ($ && body) {
      const meta = buildHTMLMetadata(url, body)
      mergeMetadata(ctx.res, meta)
    }

    return next()
  }
}

export default mware
