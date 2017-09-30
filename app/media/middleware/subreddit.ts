import { Url, parse } from 'url';
import { buildUrl } from 'utils/url';
import { MediaThumbnailSize, IMediaMiddleware, IMediaRequest, IMediaResponse } from '../types';
import { fetchText } from 'utils/http';
import { MEDIA_REFERRER } from 'constants/http';

const URL_PATTERN = /reddit\.com\/r\/([^\s/]+)\/?$/i;

const mware: IMediaMiddleware = {
  match(url) {
    return !!URL_PATTERN.exec(url.href);
  },

  async resolve(ctx, next) {
    const match = URL_PATTERN.exec(ctx.req.url.href);
    if (!match) {
      return next();
    }

    const subreddit = match[1];
    const apiUrl = `https://www.reddit.com/r/${subreddit}.json`;

    const [json] = await fetchText<any>(apiUrl, {
      json: true,
      headers: {
        Referer: MEDIA_REFERRER
      }
    });

    const children = json.data.children as any[];
    if (children.length === 0) {
      return next();
    }

    // Overwrite request url with subreddit child link
    const child = children[0];
    const url = parse(child.data.url);
    if (url && url.href) {
      ctx.req.url = url as any;
    }

    return next();
  }
};

export default mware;
