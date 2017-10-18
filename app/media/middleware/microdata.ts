import { load } from 'cheerio';

import { IMediaMiddleware } from '../types';
import { parse, toSeconds } from 'iso8601-duration';

const mware: IMediaMiddleware = {
  match({ protocol }) {
    return protocol === 'http:' || protocol === 'https:';
  },

  async resolve(ctx, next) {
    const { url } = ctx.req;

    // TODO: clean this up and make it more robust
    if (ctx.state.$) {
      const noscript = ctx.state.$(`noscript`);

      noscript.each(function(idx: number, elem: any) {
        const node = ctx.state.$(elem);
        const text = node.text();

        if (text.indexOf('schema.org') === -1) {
          return;
        }

        const $ = load(text);

        const metaDuration = $(`meta[itemprop='duration']`).attr('content');
        if (metaDuration) {
          const duration = toSeconds(parse(metaDuration)) * 1000;

          if (duration && !isNaN(duration)) {
            ctx.res.duration = duration;
          }
        }
      });
    }

    return next();
  }
};

export default mware;
