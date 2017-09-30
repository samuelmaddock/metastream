import { Url } from 'url';

export const enum MediaThumbnailSize {
  Default,
  Small,
  Medium,
  Large
}

export interface IMediaRequest {
  /** Request URL object */
  url: Url & { href: string };

  /** Media requester */
  user: any;

  /**
   * TODO
   *
   * Clients prerender HTML using hidden window with JavaScript enabled.
   * Semantic HTML is extracted as hints for the backend.
   *
   * Full HTML is not sent to the server in case sensitive data is included.
   */
  hints?: {
    /**
     * Open Graph
     * http://ogp.me/
     */
    og?: any;

    /**
     * JSON for Linking Data
     * https://json-ld.org/
     */
    jsonLD?: any;

    /**
     * Microdata
     * https://html.spec.whatwg.org/multipage/microdata.html
     */
    microdata?: any;
  };
}

export interface IMediaResponse {
  /** URL to display on client; defaults to request URL */
  url: string;

  /** Display title */
  title?: string;

  /** Milliseconds */
  duration?: number;

  /** Map of thumbnail sizes to URLs */
  // TODO: Use MediaThumbnailSize as key when TS supports it
  // https://github.com/Microsoft/TypeScript/issues/13042
  thumbnails?: { [key: number]: string };
}

export interface IMediaContext {
  req: IMediaRequest;
  res: IMediaResponse;

  /** Object for passing information through middleware */
  state: { [key: string]: any };
}

export interface IMediaMiddlewareResolve {
  (ctx: IMediaContext, next: () => PromiseLike<IMediaResponse | void>):
    | PromiseLike<IMediaResponse | void>
    | IMediaResponse
    | void;
}

/**
 * Service responsible for fetching metadata of third-party provider.
 */
export interface IMediaMiddleware {
  /** Determine if the given URL is a match for the service. */
  match(url: Url & { href: string }): boolean;

  /** Resolve metadata for the given URL. */
  resolve: IMediaMiddlewareResolve;
}
