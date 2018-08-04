import { Url } from 'url'
import { buildUrl, parseQuery } from 'utils/url'
import { MediaThumbnailSize, IMediaMiddleware, IMediaRequest, IMediaResponse } from '../types'
import { MEDIA_REFERRER, MEDIA_USER_AGENT } from '../../../constants/http'
import { load } from 'cheerio'
import { mergeMetadata, parseHtmlDescription, parseISO8601 } from '../utils'

const URL_PATTERN = /youtu\.?be(?:.com)?/i

// TODO: https://www.youtube.com/attribution_link?a=ShEHdkiTDq4&u=%2Fwatch%3Fv%3Dm-6zjXLPRHg%26feature%3Dshare
const VIDEO_ID_PATTERNS = [
  /youtu\.be\/([^#\&\?]{11})/, // youtu.be/<id>
  /\?v=([^#\&\?]{11})/, // ?v=<id>
  /\&v=([^#\&\?]{11})/, // &v=<id>
  /embed\/([^#\&\?]{11})/, // embed/<id>
  /\/v\/([^#\&\?]{11})/ // /v/<id>
]

class YouTubeClient {
  static getInstance(): YouTubeClient {
    if (!this.instance) {
      this.instance = new YouTubeClient()
    }
    return this.instance
  }

  private static instance: YouTubeClient

  getVideoId(url: string): string | null {
    let match

    for (let i = 0; i < VIDEO_ID_PATTERNS.length; i++) {
      match = VIDEO_ID_PATTERNS[i].exec(url)
      if (match) {
        break
      }
    }

    return match ? match[1] : null
  }
}

async function getScrapedMetadata(url: URL, $: CheerioStatic): Promise<Partial<IMediaResponse>> {
  const metaDuration = $('meta[itemprop=duration]')
  const isoDuration = metaDuration.attr('content')

  const metaBroadcast = $('meta[itemprop=isLiveBroadcast]')
  const metaBroadcastEndDate = $('meta[itemprop=endDate]')
  const isLiveBroadcast =
    (metaBroadcast.attr('content') || '').toLowerCase() === 'true' && !metaBroadcastEndDate

  let duration

  if (isLiveBroadcast) {
    duration = 0
  } else {
    duration = isoDuration ? parseISO8601(isoDuration) * 1000 : undefined
  }

  const metaDescription = $('#eow-description')
  const description =
    metaDescription.length === 1 ? parseHtmlDescription(metaDescription) : undefined

  if (url.searchParams.has('t')) {
    // TODO: parse '1h2m3s' format
    // startTime = parseHms(query.t)
  }

  return {
    duration,
    description
  }
}

const mware: IMediaMiddleware = {
  match(url) {
    const { hostname = '', href = '' } = url
    return !!URL_PATTERN.exec(hostname) && !!YouTubeClient.getInstance().getVideoId(href)
  },

  async resolve(ctx, next) {
    let metadata

    try {
      metadata = await getScrapedMetadata(ctx.req.url, ctx.state.$!)
    } catch (e) {
      console.error('YouTube request failed', e.message)
      return next()
    }

    mergeMetadata(ctx.res, metadata)

    // Bypass restricted embed playback
    ctx.res.state.referrer = true

    // Disable oEmbed for playlists
    ctx.state.oEmbed = false

    return next()
  }
}

export default mware
