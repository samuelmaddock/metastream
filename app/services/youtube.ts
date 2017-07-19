import { buildUrl } from "utils/url";
import { MediaMetadataService, IMediaMetadataResult } from "services/types";

const API_URL = 'https://www.googleapis.com/youtube/v3/videos';

// TODO: move into app config
const API_KEY = 'AIzaSyAjSwUHzyoxhfQZmiSqoIBQpawm2ucF11E';

const DEFAULT_QUERY = {
  key: API_KEY,
  type: 'video',
  part: 'contentDetails,snippet,status',
  videoEmbeddable: true,
  videoSyndicated: true,
};

const URL_PATTERNS = [
  /youtu\.be\/([^#\&\?]{11})/,  // youtu.be/<id>
  /\?v=([^#\&\?]{11})/,         // ?v=<id>
  /\&v=([^#\&\?]{11})/,         // &v=<id>
  /embed\/([^#\&\?]{11})/,      // embed/<id>
  /\/v\/([^#\&\?]{11})/         // /v/<id>
];

class YouTubeClient {
  static getInstance(): YouTubeClient {
    if (!this.instance) {
      this.instance = new YouTubeClient();
    }
    return this.instance;
  }

  private static instance: YouTubeClient;

  getVideoId(url: string): string | null {
    let match = URL_PATTERNS[1].exec(url);

    for (let i = 0; i < URL_PATTERNS.length; i++) {
      match = URL_PATTERNS[i].exec(url);
      if (match) { break; }
    }

    return match ? match[1] : null;
  }

  async getVideoMetadata(url: string): Promise<any> {
    const apiUrl = buildUrl(API_URL, {
      ...DEFAULT_QUERY,
      id: this.getVideoId(url)
    });

    const response = await fetch(apiUrl);
    return await response.json();
  }
}

export class YouTubeMetadataService extends MediaMetadataService {
  private yt: YouTubeClient;

  constructor() {
    super();
    this.yt = YouTubeClient.getInstance();
  }

  match(url: string): boolean {
    return !!this.yt.getVideoId(url);
  }

  async resolve(url: string): Promise<IMediaMetadataResult> {
    let metadata = await this.yt.getVideoMetadata(url);

    const result = {
      url,
      title: metadata.title,
      duration: 0,
      thumbnails: {}
    } as IMediaMetadataResult;

    return result;
  }
}
