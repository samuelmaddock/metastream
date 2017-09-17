import { load } from 'cheerio';
import { buildUrl, isUrl } from 'utils/url';
import { MediaMetadataService, IMediaMetadataResult, MediaThumbnailSize } from 'services/types';
import { fetchText, fetchResponse } from 'utils/http';
import { Url } from 'url';
import { basename } from 'path';

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

  private buildHTMLMetadata(url: Url, text: string): IMediaMetadataResult {
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
      url: url.href!,
      title,
      thumbnails
    };

    return meta;
  }

  private buildMediaMetadata(url: Url): IMediaMetadataResult {
    // TODO: get ID3 metadata from MP3s
    return {
      url: url.href!,
      title: basename(url.pathname || url.href!)
    };
  }

  async resolve(url: Url): Promise<IMediaMetadataResult> {
    const contentType = await this.fetchContentType(url.href!);

    // Avoid GET requests to media
    if (MIME_MEDIA_TYPES.has(contentType)) {
      return this.buildMediaMetadata(url);
    }

    const result = await fetch(url.href!);
    const text = await result.text();
    return this.buildHTMLMetadata(url, text);
  }
}
