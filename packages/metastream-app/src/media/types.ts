import { Url } from 'url'

export const enum MediaThumbnailSize {
  Default,
  Small,
  Medium,
  Large
}

export const enum MediaType {
  Item = 'item',
  Playlist = 'playlist'
}

export interface IMediaRequest {
  type: MediaType

  /** Request URL object */
  url: URL

  /** Media requester */
  user: any

  /** Object for passing state to the frontend */
  state?: { [key: string]: any }
}

export interface IMediaResponse {
  type: MediaType

  /** URL to display on client; defaults to request URL */
  url: string

  /** Display title */
  title?: string

  /** Milliseconds */
  duration?: number

  description?: string

  /** Map of thumbnail sizes to URLs */
  // TODO: Use MediaThumbnailSize as key when TS supports it
  // https://github.com/Microsoft/TypeScript/issues/13042
  thumbnails?: { [key: number]: string }

  /** Object for passing state to the frontend */
  state: {
    /** Requires custom referrer */
    referrer?: boolean

    [key: string]: any
  }

  hasMore?: boolean

  /** Milliseconds */
  startTime?: number
}

export interface IMediaContext {
  req: IMediaRequest
  res: IMediaResponse

  /** Object for passing information through middleware */
  state: {
    /** Raw HTML string */
    body?: string

    /** Cheerio query engine */
    $?: CheerioStatic

    /** Whether to use oEmbed */
    oEmbed?: boolean

    /** Preloaded oEmbed json */
    oEmbedJson?: string

    /** Whether HTTP HEAD request failed to fetch */
    httpHeadFailed?: boolean

    /** HTTP response code */
    responseCode?: number

    /** Response content type */
    contentType?: string

    /** Response content type shorthand */
    type?: string

    /** Whether to disable using the Googlebot UA */
    disableGooglebot?: boolean

    [key: string]: any
  }
}

export interface IMediaMiddlewareResolve {
  (ctx: IMediaContext, next: () => PromiseLike<IMediaResponse | void>):
    | PromiseLike<IMediaResponse | void>
    | IMediaResponse
    | void
}

/**
 * Service responsible for fetching metadata of third-party provider.
 */
export interface IMediaMiddleware {
  /** Determine if the given URL is a match for the service. */
  match(url: URL, ctx: IMediaContext): boolean

  /** Resolve metadata for the given URL. */
  resolve: IMediaMiddlewareResolve
}
