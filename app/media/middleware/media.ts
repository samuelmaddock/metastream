import { Url } from 'url';
import { basename } from 'path';

import { IMediaMiddleware, IMediaResponse } from '../types';

const MIME_MEDIA_TYPES = new Set(['audio', 'image', 'video']);

function buildMediaMetadata(url: Url): IMediaResponse {
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

  resolve(req, res, next) {
    const { url } = req;
    const { type } = res;

    // Avoid GET requests to media
    if (type && MIME_MEDIA_TYPES.has(type)) {
      return buildMediaMetadata(url);
    }

    return next();
  }
};

export default mware;
