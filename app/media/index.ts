import { Url, parse } from 'url';

import compose from './compose';

import { IMediaMiddleware, IMediaRequest, IMediaResponse, IMediaContext } from './types';

import subredditMware from './middleware/subreddit';
import youTubeMware from './middleware/youtube';
import httpHeadMware from './middleware/httpHead';
import mediaMware from './middleware/media';
import ogMware from './middleware/openGraph';

// prettier-ignore
const middlewares: IMediaMiddleware[] = [
  subredditMware,
  youTubeMware,

  httpHeadMware,
  mediaMware,
  ogMware
];

export const resolveMediaUrl = async (url: string): Promise<Readonly<IMediaResponse> | null> => {
  const urlObj = parse(url) as Url & { href: string };

  if (!urlObj.href) {
    return null;
  }

  const req: IMediaRequest = {
    url: urlObj,

    // TODO: add user info for logging middleware
    user: null
  };

  const res: IMediaResponse = {
    url
  };

  const ctx: IMediaContext = {
    req,
    res,
    state: {}
  };

  const fn = compose(middlewares);
  const result = (await fn(ctx)) || null;
  return result;
};
