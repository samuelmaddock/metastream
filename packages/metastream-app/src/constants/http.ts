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
const userAgentPlatform = userAgent.split(' Chrome/')[0]
export const MEDIA_SESSION_USER_AGENT = `${userAgentPlatform} Chrome/73.0.3683.86 Safari/537.36`

export const HOME_WEBSITE = 'https://getmetastream.com'
export const APP_WEBSITE = 'https://app.getmetastream.com'
export const MEDIA_REFERRER = APP_WEBSITE

export const WEBVIEW_PARTITION = 'persist:mediaplayer'
