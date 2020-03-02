import { IMediaMiddleware } from '../types'
import { fetchResponse } from 'utils/http'
import { MEDIA_USER_AGENT } from 'constants/http'

const getContentTypeToken = (val?: string | string[]) => {
  val = Array.isArray(val) ? val[0] : val
  val = (val && val.split(';').shift()) || ''
  return val.trim()
}

/** https://www.w3.org/Protocols/rfc1341/4_Content-Type.html */
const getTypeToken = (val?: string) => (val ? (val.split('/').shift() || '').toLowerCase() : '')

const mware: IMediaMiddleware = {
  match({ protocol }: URL) {
    return protocol === 'http:' || protocol === 'https:'
  },

  async resolve(ctx, next) {
    const { url } = ctx.req

    // Request HEAD response to check MIME type
    let response

    try {
      response = await fetchResponse(url.href, {
        method: 'HEAD',
        headers: {
          'user-agent': MEDIA_USER_AGENT,
          referer: url.href // prevent hotlink blocking
        }
      })
    } catch {
      ctx.state.httpHeadFailed = true
      return next()
    }

    const code = response.status || 200

    const server = response.headers['server']
    const contentType = getContentTypeToken(response.headers['content-type'])
    const type = getTypeToken(contentType)

    ctx.state.responseCode = code
    ctx.state.contentType = contentType
    ctx.state.type = type

    // #244: Cloudflare validates agents using the Googlebot UA
    ctx.state.disableGooglebot = server === 'cloudflare'

    return next()
  }
}

export default mware
