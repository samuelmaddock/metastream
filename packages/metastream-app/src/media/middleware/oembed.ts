import { load } from 'cheerio'
import { IMediaMiddleware } from '../types'
import { fetchText } from 'utils/http'
import { Url } from 'url'
import { MEDIA_USER_AGENT } from 'constants/http'
import { mergeMetadata } from '../utils'

const WORDPRESS_OEMBED_PATH = /\/wp-json\/oembed\/.*?\/embed/i

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
    if (typeof ctx.state.oEmbed === 'boolean' && !ctx.state.oEmbed) {
      return next()
    }

    const { url } = ctx.req

    let json

    if (ctx.state.oEmbedJson) {
      json = ctx.state.oEmbedJson
    } else if (ctx.state.$) {
      const { $ } = ctx.state
      const link = $(`link[type='text/json+oembed'], link[type='application/json+oembed']`).attr(
        'href'
      )

      if (
        link &&
        // Wordpress embeds are super generic
        !WORDPRESS_OEMBED_PATH.test(link)
      ) {
        json = await fetchOEmbed(link)
      }
    }

    if (json) {
      console.info('oembed', json)
      const src = parseOembedUrl(json)

      const meta = {
        url: src,
        description: json.description
      }

      mergeMetadata(ctx.res, meta)
    }

    return next()
  }
}

export default mware
