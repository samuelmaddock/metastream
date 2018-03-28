/**
 * Use bot UA to fetch prerendered webpages.
 * Using Googlebot UA from a non-Google IP triggers Cloudflare's blocker.
 *
 * Twitch doesn't serve og:meta unless 'Googlebot' is in the UA :|
 */
export const MEDIA_USER_AGENT =
  'Mozilla/5.0 (compatible; Mediabot/1.0; Googlebot; +https://getmetastream.com/)'

export const MEDIA_REFERRER = 'https://getmetastream.com/'

export const WEBVIEW_PARTITION = 'persist:mediaplayer'
