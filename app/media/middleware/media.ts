import { Url } from 'url';
import { basename } from 'path';

import { IMediaMiddleware, IMediaResponse } from '../types';

const MIME_MEDIA_TYPES = new Set(['audio', 'image', 'video']);

function buildMediaMetadata(url: Url): Partial<IMediaResponse> {
  // TODO: get ID3 metadata from MP3s
  return {
    url: url.href!,
    title: basename(url.pathname || url.href!)
  };
}

const mware: IMediaMiddleware = {
  match({ protocol }) {
    return protocol === 'http:' || protocol === 'https:';
  },

  resolve(ctx, next) {
    const { url } = ctx.req;
    const { type } = ctx.state;

    // Avoid GET requests to media
    if (type && MIME_MEDIA_TYPES.has(type)) {
      const meta = buildMediaMetadata(url);
      Object.assign(ctx.res, meta);
      return ctx.res;
    }

    return next();
  }
};

export default mware;
