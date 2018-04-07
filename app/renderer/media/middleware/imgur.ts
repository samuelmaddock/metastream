import { IMediaMiddleware } from '../types'

const mware: IMediaMiddleware = {
  match(url) {
    const { hostname = '' } = url
    return hostname.endsWith('imgur.com')
  },

  async resolve(ctx, next) {
    const { $ } = ctx.state

    if ($) {
      const title = $('title')
        .text()
        .trim()
      const imageSrc = $('link[rel=image_src]').attr('href')
      const isAlbum = title.endsWith('Album on Imgur')

      if (!isAlbum && imageSrc) {
        await next()
        ctx.res.url = imageSrc
        return ctx.res
      }
    }

    return next()
  }
}

export default mware
