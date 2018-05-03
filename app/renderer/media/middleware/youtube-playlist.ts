import { Url, parse } from 'url'
import { buildUrl, encodeQueryParams } from 'utils/url'
import {
  MediaThumbnailSize,
  IMediaMiddleware,
  IMediaRequest,
  IMediaResponse,
  MediaType,
  IMediaContext
} from '../types'
import { fetchText } from 'utils/http'
import { MEDIA_REFERRER } from 'constants/http'

const URL_PATTERN = /youtu\.?be(?:.com)?/i

const PLAYLIST_LEN_PATTERN = /"playlist_length":"(\d+)"/i

interface IYouTubePlaylistState {
  title: string
  index: number
  length: number
}

const mware: IMediaMiddleware = {
  match(url, ctx) {
    const isYouTube = !!URL_PATTERN.exec(url.href)
    const isPlaylist = url.searchParams.has('list')
    return (isYouTube && isPlaylist) || Boolean(ctx.req.state && ctx.req.state.ytpl)
  },

  async resolve(ctx, next) {
    const { state } = ctx.req
    const ytpl: IYouTubePlaylistState = (state && state.ytpl) || {}

    const isInitialRequest = typeof ytpl.index === 'undefined'

    if (isInitialRequest) {
      await next()

      const { res } = ctx

      const { body, $ } = ctx.state
      if (!body || !$) return

      const title = $('.playlist-title').text() || res.title
      ytpl.title = (title || 'YouTube Playlist').trim()

      const rawLen = $('#playlist-length')
        .text()
        .split(' ')[0]
      const len = parseInt(rawLen, 10)
      if (isNaN(len)) return

      ytpl.length = len

      const rawIndex = $('li.currently-playing').data('index')
      const params = ctx.req.url.searchParams
      const index = rawIndex || params.get('index') || '0'
      ytpl.index = parseInt(index, 10) || 0

      ctx.res.state.ytpl = ytpl
    } else {
      ytpl.index++

      const url = ctx.req.url
      url.pathname = '/embed/videoseries'
      url.searchParams.set('index', `${ytpl.index}`)
      ctx.res.url = url.toString()
    }

    let { index, length, title } = ytpl

    ctx.res.title = title
    ctx.res.state = { ...ctx.req.state, ytpl }
    ctx.res.hasMore = index < length - 1

    return ctx.res
  }
}

export default mware
