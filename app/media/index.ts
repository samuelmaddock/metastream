import { Url, parse } from 'url';

import compose from './compose';

import { IMediaMiddleware, IMediaRequest, IMediaResponse } from './types';
import youTubeMiddleware from './middleware/youtube';
import webMiddleware from './middleware/web';

// prettier-ignore
const middlewares: IMediaMiddleware[] = [
  youTubeMiddleware,
  webMiddleware
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

  // prettier-ignore
  const resolvers = middlewares
    .filter(mware => mware.match(urlObj))
    .map(mware => mware.resolve);

  const fn = compose(resolvers);
  const result = (await fn(req, res)) || null;
  return result;
};
