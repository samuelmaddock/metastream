import { IMediaMiddleware } from '../types'
import { MediaRequestError, MediaRequestErrorCode } from 'media/error'

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
 */
const ALLOWED_CONTENT_TYPES = new Set([
  'image/gif',
  'text/html',
  'image/jpeg',
  'audio/mpeg',
  'video/mpeg',
  'audio/ogg',
  'video/ogg',
  'application/ogg',
  'audio/opus',
  'image/svg+xml',
  'text/plain',
  'audio/wav',
  'audio/webm',
  'video/webm',
  'image/webp',
  'application/xhtml+xml'
])

const mware: IMediaMiddleware = {
  match({ protocol }: URL) {
    return protocol === 'http:' || protocol === 'https:'
  },

  async resolve(ctx, next) {
    const { contentType, headResponseHeaders: headers } = ctx.state

    if (headers) {
      const contentDisp = headers['content-disposition']
      if (typeof contentDisp === 'string' && contentDisp.startsWith('attachment')) {
        throw new MediaRequestError(MediaRequestErrorCode.DownloadLink)
      }
    }

    // TODO: Disallow any content types known to cause download
    // if (contentType && !ALLOWED_CONTENT_TYPES.has(contentType)) {
    //   throw new MediaRequestError(MediaRequestErrorCode.InvalidContentType)
    // }

    return next()
  }
}

export default mware
