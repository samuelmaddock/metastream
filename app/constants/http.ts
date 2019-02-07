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

/**
 * User agent override to prevent sniffing from breaking apps until
 * issue #1 can be resolved.
 */
export const MEDIA_SESSION_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.96 Safari/537.36'

export const APP_WEBSITE = 'https://getmetastream.com/'
export const MEDIA_REFERRER = APP_WEBSITE

export const WEBVIEW_PARTITION = 'persist:mediaplayer'
