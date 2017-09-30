import { load } from 'cheerio';
import { MediaThumbnailSize, IMediaMiddleware, IMediaResponse } from '../types';
import { fetchText } from 'utils/http';
import { Url } from 'url';
import { MEDIA_USER_AGENT } from 'constants/http';

function buildHTMLMetadata(url: Url, text: string): IMediaResponse {
  const $ = load(text);

  const title = $('meta[property="og:title"]').attr('content') || $('title').text();
  // const src = $('meta[property="og:url"]').attr('content') || url;
  const image = $('meta[property="og:image"]').attr('content');

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
