import { load } from 'cheerio';
import { MediaThumbnailSize, IMediaRequest, IMediaMiddleware, IMediaResponse } from '../types';
import { fetchText, fetchResponse } from 'utils/http';
import { Url } from 'url';
import { basename } from 'path';

const MIME_MEDIA_TYPES = new Set(['audio', 'image', 'video']);

async function fetchContentType(url: string) {
  // Request HEAD response to check MIME type
  const head = await fetchResponse(url, {
    method: 'HEAD'
  });

  const contentType: string | undefined = head.headers['content-type'];

  // https://www.w3.org/Protocols/rfc1341/4_Content-Type.html
  const type = contentType ? (contentType.split('/').shift() || '').toLowerCase() : '';

  return type;
}

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

function buildMediaMetadata(url: Url): IMediaResponse {
  // TODO: get ID3 metadata from MP3s
  return {
    url: url.href!,
    title: basename(url.pathname || url.href!)
  };
}

const mware: IMediaMiddleware = {
  match({ protocol }: Url) {
    return protocol === 'http:' || protocol === 'https:';
  },

  async resolve(req: IMediaRequest): Promise<IMediaResponse> {
    const { url } = req;

    const contentType = await fetchContentType(url.href);

    // Avoid GET requests to media
    if (MIME_MEDIA_TYPES.has(contentType)) {
      return buildMediaMetadata(url);
    }

    const result = await fetch(url.href);
    const text = await result.text();
    return buildHTMLMetadata(url, text);
  }
};

export default mware;
