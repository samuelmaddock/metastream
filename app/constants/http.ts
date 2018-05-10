/**
 * Use bot UA to fetch prerendered webpages.
 * Using Googlebot UA from a non-Google IP triggers Cloudflare's blocker.
 *
 * Twitch doesn't serve og:meta unless 'Googlebot' is in the UA :|
 */
const defaultUserAgent =
  'Mozilla/5.0 (compatible; Mediabot/1.0; Googlebot; +https://getmetastream.com/)'
const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : defaultUserAgent
export const MEDIA_USER_AGENT = `${userAgent} (Googlebot)`

export const MEDIA_REFERRER = 'https://getmetastream.com/'

export const WEBVIEW_PARTITION = 'persist:mediaplayer'
