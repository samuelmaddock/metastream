/**
 * Use bot UA to fetch prerendered webpages.
 * Using Googlebot UA from a non-Google IP triggers Cloudflare's blocker.
 */
export const MEDIA_USER_AGENT =
  'Mozilla/5.0 (compatible; Mediabot/2.1; +http://samuelmaddock.com/)';
