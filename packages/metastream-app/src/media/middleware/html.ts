import { load } from 'cheerio'
import { IMediaMiddleware, IMediaContext } from '../types'
import { fetchText } from 'utils/http'
import { MEDIA_USER_AGENT } from 'constants/http'

const parseTitle = ($: CheerioStatic) =>
  $('title')
    .text()
    .trim()

/** Prefer non-ico icons. */
const sortIcons = (a: CheerioElement, b: CheerioElement) => {
  const aIco = a.attribs.href.includes('.ico')
  const bIco = b.attribs.href.includes('.ico')

  if (aIco && !bIco) return 1
  if (!aIco && bIco) return -1
  return 0
}

const parseFavicon = (ctx: IMediaContext, $: CheerioStatic) => {
  const icons = Array.from($('head link')).filter(icon => {
    const rel = new Set((icon.attribs.rel || '').split(' '))
    if (!rel.has('icon')) return false
    return true
  })

  if (icons.length === 0) return

  icons.sort(sortIcons)

  const icon = icons[0]
  let url

  try {
    url = new URL(icon.attribs.href).href
  } catch {}

  if (!url) {
    try {
      url = new URL(`${ctx.req.url.origin}${icon.attribs.href}`).href
    } catch {}
  }

  return url
}

const mware: IMediaMiddleware = {
  match({ protocol }) {
    return protocol === 'http:' || protocol === 'https:'
  },

  async resolve(ctx, next) {
    const { url } = ctx.req

    // Skip if HEAD request fails to avoid fetching huge blobs of data
    if (ctx.state.httpHeadFailed) {
      return next()
    }

    let text

    try {
      const result = await fetchText(url.href, {
        headers: ctx.state.disableGooglebot
          ? {}
          : {
              'user-agent': MEDIA_USER_AGENT,
              host: url.host
            }
      })
      text = result[0]
    } catch {
      return next()
    }

    ctx.state.body = text
    const $ = (ctx.state.$ = load(text))

    try {
      ctx.res.title = parseTitle($) || ctx.res.title
      ctx.res.favicon = parseFavicon(ctx, $)
    } catch (e) {
      console.error(e)
    }

    return next()
  }
}

export default mware
