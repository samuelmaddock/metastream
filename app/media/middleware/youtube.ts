import { Url } from 'url';
import { buildUrl } from 'utils/url';
import { MediaThumbnailSize, IMediaMiddleware, IMediaRequest, IMediaResponse } from '../types';
import { fetchText } from 'utils/http';

const API_URL = 'https://www.googleapis.com/youtube/v3/videos';

// TODO: move into app config
const API_KEY = 'AIzaSyAlDyii-2FVIOD4lR0lZBzrig3BNQWKA14';

const DEFAULT_QUERY = {
  key: API_KEY,
  type: 'video',
  part: 'contentDetails,snippet,status',
  videoEmbeddable: true,
  videoSyndicated: true
};

const URL_PATTERN = /youtu\.?be(?:.com)?/i;

// TODO: https://www.youtube.com/attribution_link?a=ShEHdkiTDq4&u=%2Fwatch%3Fv%3Dm-6zjXLPRHg%26feature%3Dshare
const VIDEO_ID_PATTERNS = [
  /youtu\.be\/([^#\&\?]{11})/, // youtu.be/<id>
  /\?v=([^#\&\?]{11})/, // ?v=<id>
  /\&v=([^#\&\?]{11})/, // &v=<id>
  /embed\/([^#\&\?]{11})/, // embed/<id>
  /\/v\/([^#\&\?]{11})/ // /v/<id>
];

/** Parse YouTube's duration format */
const parseTime = (duration: string): number => {
  let a = duration.match(/\d+/g);
  if (!a) {
    return -1;
  }

  let vector = a as (string | number)[];

  if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
    vector = [0, a[0], 0];
  }
  if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
    vector = [a[0], 0, a[1]];
  }
  if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
    vector = [a[0], 0, 0];
  }

  if (!vector) {
    return -1;
  }

  let time = 0;

  if (vector.length == 3) {
    time = time + parseInt(vector[0] as string, 10) * 3600;
    time = time + parseInt(vector[1] as string, 10) * 60;
    time = time + parseInt(vector[2] as string, 10);
  }

  if (vector.length == 2) {
    time = time + parseInt(vector[0] as string, 10) * 60;
    time = time + parseInt(vector[1] as string, 10);
  }

  if (vector.length == 1) {
    time = time + parseInt(vector[0] as string, 10);
  }
  return time;
};

class YouTubeClient {
  static getInstance(): YouTubeClient {
    if (!this.instance) {
      this.instance = new YouTubeClient();
    }
    return this.instance;
  }

  private static instance: YouTubeClient;

  getVideoId(url: string): string | null {
    let match;

    for (let i = 0; i < VIDEO_ID_PATTERNS.length; i++) {
      match = VIDEO_ID_PATTERNS[i].exec(url);
      if (match) {
        break;
      }
    }

    return match ? match[1] : null;
  }

  async getVideoMetadata(url: string): Promise<Partial<IMediaResponse>> {
    const videoId = this.getVideoId(url);
    const apiUrl = buildUrl(API_URL, {
      ...DEFAULT_QUERY,
      id: videoId
    });

    const [json] = await fetchText<any>(apiUrl, {
      json: true,
      headers: {
        Referer: 'http://mediaplayer.samuelmaddock.com'
      }
    });

    console.debug('youtube', json);

    if (json.error) {
      throw new Error(JSON.stringify(json.error));
    }

    const { pageInfo } = json;
    const { totalResults } = pageInfo;

    if (totalResults < 1) {
      throw new Error('No results');
    }

    const item = json.items[0];
    const { snippet } = item;
    let duration = 0;

    if (snippet.liveBroadcastContent === 'none') {
      const str = item.contentDetails.duration;
      duration = parseTime(str) * 1000; // sec to ms
    } else {
      duration = 0;
    }

    // TODO: how to handle paid content?

    // Show fullscreen embed if video supports it
    const embedUrl = item.status.embeddable
      ? buildUrl(`https://www.youtube.com/embed/${videoId}`, {
          autoplay: 1,
          controls: 0,
          fs: 0,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3 // disable annotations
        })
      : url;

    return {
      url: embedUrl,
      title: snippet.title,
      description: snippet.description,
      duration,
      thumbnails: {
        [MediaThumbnailSize.Default]: snippet.thumbnails.medium.url
      }
    };
  }
}

const yt = YouTubeClient.getInstance();

const mware: IMediaMiddleware = {
  match(url) {
    const { hostname = '', href = '' } = url;
    return !!URL_PATTERN.exec(hostname) && !!yt.getVideoId(href);
  },

  async resolve(ctx, next) {
    let metadata;

    try {
      metadata = await yt.getVideoMetadata(ctx.req.url.href);
    } catch (e) {
      console.error('YouTube request failed', e.message);
      return next();
    }

    Object.assign(ctx.res, metadata);

    return ctx.res;
  }
};

export default mware;
