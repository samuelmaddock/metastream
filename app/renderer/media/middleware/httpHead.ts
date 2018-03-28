import { MediaThumbnailSize, IMediaRequest, IMediaMiddleware, IMediaResponse } from '../types'
import { fetchText, fetchResponse } from 'utils/http'
import { Url } from 'url'
import { basename } from 'path'
import { MEDIA_USER_AGENT } from 'constants/http'

/** https://www.w3.org/Protocols/rfc1341/4_Content-Type.html */
const getContentType = (val: string | undefined) =>
  val ? (val.split('/').shift() || '').toLowerCase() : ''

const mware: IMediaMiddleware = {
  match({ protocol }: Url) {
    return protocol === 'http:' || protocol === 'https:'
  },

  async resolve(ctx, next) {
    const { url } = ctx.req

    // Request HEAD response to check MIME type
    const response = await fetchResponse(url.href, {
      method: 'HEAD',
      headers: {
        'user-agent': MEDIA_USER_AGENT,
        referer: url.href // prevent hotlink blocking
      }
    })

    const code = response.statusCode || 200
    // if (code >= 400) {
    //   return;
    // }

    let contentType = response.headers['content-type']
    contentType = Array.isArray(contentType) ? contentType[0] : contentType
    const type = getContentType(contentType)

    ctx.state.responseCode = code
    ctx.state.contentType = contentType
    ctx.state.type = type

    return next()
  }
}

export default mware
