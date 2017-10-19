import { load } from 'cheerio';
import { IMediaMiddleware } from '../types';
import { fetchText } from 'utils/http';
import { Url } from 'url';
import { MEDIA_USER_AGENT } from 'constants/http';

async function resolveOEmbed(url: string) {
  const [text] = await fetchText(url, {
    json: true,
    headers: {
      'user-agent': MEDIA_USER_AGENT
    }
  });

  const json = text as any;

  console.info('oembed', json);

  if (typeof json.html === 'string') {
    const $ = load(json.html);
    const src = $('iframe').attr('src');

    if (src) {
      json.url = src;
    }
  }

  return json;
}

const mware: IMediaMiddleware = {
  match({ protocol }) {
    return protocol === 'http:' || protocol === 'https:';
  },

  async resolve(ctx, next) {
    const { url } = ctx.req;

    if (ctx.state.$) {
      const link = ctx.state.$(`link[type='text/json+oembed']`).attr('href');
      if (link) {
        const json = await resolveOEmbed(link);
        if (json.url) {
          ctx.res.url = json.url;
        }

        if (json.description) {
          ctx.res.description = json.description;
        }
      }
    }

    return next();
  }
};

export default mware;
