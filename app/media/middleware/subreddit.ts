import { Url, parse } from 'url';
import { buildUrl, encodeQueryParams } from 'utils/url';
import {
  MediaThumbnailSize,
  IMediaMiddleware,
  IMediaRequest,
  IMediaResponse,
  MediaType
} from '../types';
import { fetchText } from 'utils/http';
import { MEDIA_REFERRER } from 'constants/http';

// https://www.reddit.com/dev/api/

const enum ObjectType {
  Comment = 't1',
  Account = 't2',
  Link = 't3',
  Message = 't4',
  Subreddit = 't5',
  Award = 't6'
}

const URL_PATTERN = /reddit\.com\/r\/([^\s/]+)\/?/i;
const API_LIMIT = 5;

const transformPost = ({ data }: any) => ({
  id: data.id,
  url: data.url
});

const getListing = async (url: string, after?: string) => {
  const urlobj = parse(url, true);

  const paramObj = {
    ...urlobj.query,
    limit: API_LIMIT
  };

  if (after) {
    paramObj.after = after;
  }

  const params = encodeQueryParams(paramObj);

  // TODO: Keep GET params for filtering
  // TODO: Pick up from previous playlist state
  const apiUrl = `${urlobj.protocol}//${urlobj.hostname}${urlobj.pathname}.json?${params}`;

  const [json] = await fetchText<any>(apiUrl, {
    json: true,
    headers: {
      Referer: MEDIA_REFERRER
    }
  });

  return json;
};

const getNextPosts = (json: any) => {
  const posts = (json.data.children as any[])
    .filter(post => !post.data.stickied)
    .map(transformPost);
  return posts;
};

const mware: IMediaMiddleware = {
  match(url, ctx) {
    return !!URL_PATTERN.exec(url.href) || !!(ctx.req.state && ctx.req.state.reddit);
  },

  async resolve(ctx, next) {
    const reqState = ctx.req.state;

    let redditUrl;
    let children: any[];
    let after;
    let currentIdx;

    // TODO: filter for API listings (/hot, /new, etc.)
    // https://www.reddit.com/dev/api/#section_listings
    if (reqState && reqState.reddit) {
      redditUrl = reqState.reddit.href;
      children = reqState.reddit.children;
      after = reqState.reddit.after;
      currentIdx = reqState.reddit.idx;
    } else {
      redditUrl = ctx.req.url.href;
      const json = await getListing(redditUrl);
      console.log('Subreddit JSON', json);

      const posts = getNextPosts(json);

      if (posts.length === 0) {
        return next();
      }

      children = posts;
      after = json.data.after;
      currentIdx = -1;
    }

    let idx = currentIdx + 1;
    let child = children[idx];

    if (!child) {
      const json = await getListing(reqState!.reddit.href, reqState!.reddit.after);
      const posts = getNextPosts(json);

      if (posts.length === 0) {
        return next();
      }

      idx = 0;
      children = posts;
      child = children[idx];
      after = json.data.after;
    }

    // Overwrite request url with subreddit post
    const url = parse(child.url);
    if (url && url.href) {
      ctx.req.url = url as any;
    }

    // Save pagination info for resolving next playlist item
    ctx.res.type = MediaType.Playlist;
    ctx.res.state = {
      ...ctx.res.state,
      reddit: {
        ...(reqState || {}).reddit,
        href: redditUrl,
        idx,
        children,
        after
      }
    };

    return next();
  }
};

export default mware;
