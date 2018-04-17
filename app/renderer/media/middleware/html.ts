import { load } from 'cheerio'
import { IMediaMiddleware } from '../types'
import { fetchText } from 'utils/http'
import { MEDIA_USER_AGENT } from 'constants/http'

const mware: IMediaMiddleware = {
  match({ protocol }) {
    return protocol === 'http:' || protocol === 'https:'
  },

  async resolve(ctx, next) {
    const { url } = ctx.req

    const [text, response] = await fetchText(url.href, {
      headers: {
        'user-agent': MEDIA_USER_AGENT,
        host: url.host
      }
    })

    ctx.state.body = text
    ctx.state.$ = load(text)

    return next()
  }
}

export default mware
