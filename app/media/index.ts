import { Url, parse } from 'url';

import compose from './compose';

import { IMediaMiddleware, IMediaRequest, IMediaResponse, IMediaContext, MediaType } from './types';

import subredditMware from './middleware/subreddit';
import youTubeMware from './middleware/youtube';
import httpHeadMware from './middleware/httpHead';
import mediaMware from './middleware/media';
import ogMware from './middleware/openGraph';
import oEmbedMware from './middleware/oembed';

import { IMediaItem } from 'lobby/reducers/mediaPlayer';

// prettier-ignore
const middlewares: IMediaMiddleware[] = [
  subredditMware,
  youTubeMware,

  httpHeadMware,
  mediaMware,
  ogMware,
  oEmbedMware
];

type MediaUrl = Url & { href: string };

const createContext = (url: MediaUrl) => {
  const req: IMediaRequest = {
    type: MediaType.Item,
    url,

    // TODO: add user info for logging middleware
    user: null
  };

  const res: IMediaResponse = {
    type: MediaType.Item,
    url: url.href,
    state: {}
  };

  const ctx: IMediaContext = {
    req,
    res,
    state: {}
  };

  return ctx;
};

export const resolveMediaUrl = async (url: string): Promise<Readonly<IMediaResponse> | null> => {
  const urlObj = parse(url) as MediaUrl;
  if (!urlObj.href) {
    return null;
  }

  const ctx = createContext(urlObj);

  const fn = compose(middlewares);
  const result = (await fn(ctx)) || ctx.res;
  return result;
};

export const resolveMediaPlaylist = async (
  media: IMediaItem
): Promise<Readonly<IMediaResponse> | null> => {
  const urlObj = parse(media.url) as MediaUrl;
  if (!urlObj.href) {
    return null;
  }

  const ctx = createContext(urlObj);

  // Transfer old state to new request
  Object.assign(ctx.req, {
    type: media.type,
    state: media.state
  });

  console.log('resolving playlist', ctx);

  const fn = compose(middlewares);
  const result = (await fn(ctx)) || ctx.res;
  return result;
};
