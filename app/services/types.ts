export const enum MediaThumbnailSize {
  Default,
  Small,
  Medium,
  Large
}

export interface IMediaMetadataResult {
  /** Request URL */
  url: string;

  title: string;

  /** Duration in ms */
  duration?: number;

  /** Map of thumbnail sizes to URLs */
  // TODO: Use MediaThumbnailSize as key when TS supports it
  // https://github.com/Microsoft/TypeScript/issues/13042
  thumbnails: { [key: number]: string };
}

/**
 * Service responsible for fetching metadata of third-party provider.
 */
export abstract class MediaMetadataService {
  /** Determine if the given URL is a match for the service. */
  abstract match(url: string): boolean;

  /** Resolve metadata for the given URL. */
  abstract async resolve(url: string): Promise<IMediaMetadataResult>;
}
