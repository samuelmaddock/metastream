import { load } from 'cheerio';
import { MediaThumbnailSize, IMediaMiddleware, IMediaResponse } from '../types';
import { fetchText } from 'utils/http';
import { Url } from 'url';
import { MEDIA_USER_AGENT } from 'constants/http';

import { parse } from './og';

function buildHTMLMetadata(url: Url, body: string): IMediaResponse {
  const og = parse(body, {});
  console.log('og', og);
  const { ogTitle: title, ogImage: image } = og;

  const thumbnails = image
    ? {
        [MediaThumbnailSize.Default]: image
      }
    : undefined;

  const meta: IMediaResponse = {
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

  async resolve(req): Promise<IMediaResponse> {
    const { url } = req;

    const [text, response] = await fetchText(url.href, {
      headers: {
        'user-agent': MEDIA_USER_AGENT
      }
    });

    return buildHTMLMetadata(url, text);
  }
};

export default mware;
