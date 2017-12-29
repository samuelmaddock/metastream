import { IMediaMiddleware } from '../types';
import { Url, parse, format } from 'url';
import { encodeQueryParams } from 'utils/url';

const setQueryTrue = (prop: string, query: any) => {
  if (!!query[prop]) {
    query[prop] = 'true';
    return true;
  }
};

/** Set autoplay query param to true */
const setAutoplay = (url: string) => {
  const urlObj = parse(url, true);
  const { query } = urlObj;

  if (!(setQueryTrue('autoplay', query) || setQueryTrue('auto_play', query))) {
    ['autoplay', 'auto_play'].forEach(prop => {
      query[prop] = 'true';
    });
  }

  urlObj.search = encodeQueryParams(query);

  return format(urlObj);
};

const mware: IMediaMiddleware = {
  match({ protocol, host }) {
    // BUG: server returns Access Denied
    if (host && host.indexOf('redd.it') > -1) {
      return false;
    }
    return protocol === 'http:' || protocol === 'https:';
  },

  async resolve(ctx, next) {
    const { url } = ctx.req;

    ctx.res.url = setAutoplay(ctx.res.url);

    return next();
  }
};

export default mware;
