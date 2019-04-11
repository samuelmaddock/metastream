import { Url } from 'url'
import { basename } from 'path'

import { IMediaMiddleware, IMediaResponse } from '../types'

const MIME_MEDIA_TYPES = new Set(['audio', 'image', 'video'])

function buildMediaMetadata(url: URL): Partial<IMediaResponse> {
  // TODO: get ID3 metadata from MP3s
  return {
    url: url.href!,
    title: basename(url.pathname || url.href!)
  }
}

const mware: IMediaMiddleware = {
  match({ protocol }) {
    return protocol === 'http:' || protocol === 'https:'
  },

  resolve({ req, res, state }, next) {
    const { url } = req
    const { type } = state

    // Avoid GET requests to media
    if (type && MIME_MEDIA_TYPES.has(type)) {
      const meta = buildMediaMetadata(url)
      res.url = meta.url || res.url
      res.title = res.title || meta.title
      return res
    }

    return next()
  }
}

export default mware
