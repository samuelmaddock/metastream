import { load } from 'cheerio';
import { MediaThumbnailSize, IMediaMiddleware, IMediaResponse } from '../types';
import { fetchText } from 'utils/http';
import { Url } from 'url';
import { MEDIA_USER_AGENT } from 'constants/http';

import { parse } from './og';

function buildHTMLMetadata(url: Url, body: string): Partial<IMediaResponse> {
  const og = parse(body, {});
  console.log('og', og);
  const { ogTitle: title, ogImage: image } = og;

  const thumbnails = image
    ? {
        [MediaThumbnailSize.Default]: image
      }
    : undefined;

  const meta: Partial<IMediaResponse> = {
    url: url.href!,
    title,
    thumbnails
  };

  if (og.ogVideo) {
    meta.url = og.ogVideo.url || meta.url;
  }

  return meta;
}

const mware: IMediaMiddleware = {
  match({ protocol }) {
    return protocol === 'http:' || protocol === 'https:';
  },

  async resolve(ctx): Promise<IMediaResponse> {
    const { url } = ctx.req;

    const [text, response] = await fetchText(url.href, {
      headers: {
        'user-agent': MEDIA_USER_AGENT
      }
    });

    const meta = buildHTMLMetadata(url, text);
    Object.assign(ctx.res, meta);
    return ctx.res;
  }
};

export default mware;
