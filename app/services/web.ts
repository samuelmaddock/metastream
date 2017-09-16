import { load } from 'cheerio';
import { buildUrl, isUrl } from 'utils/url';
import { MediaMetadataService, IMediaMetadataResult, MediaThumbnailSize } from 'services/types';
import { fetchText, fetchResponse } from 'utils/http';
import { Url } from 'url';

const MIME_MEDIA_TYPES = new Set(['audio', 'image', 'video']);

export class WebMetadataService extends MediaMetadataService {
  match({ protocol }: Url): boolean {
    return protocol === 'http:' || protocol === 'https:';
  }

  private async fetchContentType(url: string) {
    // Request HEAD response to check MIME type
    const head = await fetchResponse(url, {
      method: 'HEAD'
    });

    const contentType: string | undefined = head.headers['content-type'];

    // https://www.w3.org/Protocols/rfc1341/4_Content-Type.html
    const type = contentType ? (contentType.split('/').shift() || '').toLowerCase() : '';

    return type;
  }

  async resolve(url: string): Promise<IMediaMetadataResult> {
    const contentType = await this.fetchContentType(url);

    // Avoid GET requests to media
    if (MIME_MEDIA_TYPES.has(contentType)) {
      // TODO: get ID3 metadata from MP3s
      return {
        url,
        title: url
      };
    }

    const result = await fetch(url);
    const text = await result.text();
    const $ = load(text);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    // const src = $('meta[property="og:url"]').attr('content') || url;
    const image = $('meta[property="og:image"]').attr('content');

    const thumbnails = image
      ? {
          [MediaThumbnailSize.Default]: image
        }
      : undefined;

    const meta: IMediaMetadataResult = {
      url,
      title,
      thumbnails
    };

    return meta;
  }
}
