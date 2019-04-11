import { MediaThumbnailSize, IMediaMiddleware, IMediaResponse } from '../types'

import { parse } from './og'
import { mergeMetadata } from '../utils'

/** Bad video types to not use. */
const BAD_VIDEO_TYPES = new Set(['application/x-shockwave-flash'])

/** Disable using opengraph videos on specific websites. */
const IGNORE_VIDEO_HOSTNAMES = new Set([
  'www.netflix.com' // ignore series trailer
])

function buildHTMLMetadata(url: URL, body: string): Partial<IMediaResponse> {
  const og = parse(body, {})
  console.log('og', og)
  const { ogTitle: title, ogImage: image, ogDescription: description } = og

  const thumbnails = image
    ? {
        [MediaThumbnailSize.Default]: image.url
      }
    : undefined

  const meta: Partial<IMediaResponse> = {
    url: url.href!,
    title,
    thumbnails,
    description
  }

  let useVideo = !IGNORE_VIDEO_HOSTNAMES.has(url.hostname)

  if (useVideo && og.ogVideo) {
    const type = og.ogVideo.type
    useVideo = type ? !BAD_VIDEO_TYPES.has(type) : true
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
