import { load } from 'cheerio'
import { IMediaMiddleware } from '../types'
import { fetchText } from 'utils/http'
import { Url } from 'url'
import { MEDIA_USER_AGENT } from 'constants/http'

async function fetchOEmbed(url: string) {
  const [json] = await fetchText(url, {
    json: true,
    headers: {
      'user-agent': MEDIA_USER_AGENT
    }
  })

  return json as any
}

function parseOembedUrl(json: any) {
  if (typeof json.html === 'string') {
    // Decode html entities if needed
    const html = json.html.startsWith('&lt;') ? load(json.html)('body').text() : json.html
    const $ = load(html)
    let src = $('iframe').attr('src')

    if (src) {
      // TODO: always use https???
      return src.startsWith('//') ? `http:${src}` : src
    }
  }
}

const mware: IMediaMiddleware = {
  match({ protocol }) {
    return protocol === 'http:' || protocol === 'https:'
  },

  async resolve(ctx, next) {
    const { url } = ctx.req

    let json

    if (ctx.state.oembed) {
      json = ctx.state.oembed
    } else if (ctx.state.$) {
      const { $ } = ctx.state
      const link = $(`link[type='text/json+oembed'], link[type='application/json+oembed']`).attr(
        'href'
      )

      if (link) {
        json = await fetchOEmbed(link)
      }
    }

    if (json) {
      console.info('oembed', json)
      const src = parseOembedUrl(json)

      if (src) {
        ctx.res.url = src
      }

      if (json.description) {
        ctx.res.description = json.description
      }
    }

    return next()
  }
}

export default mware
