/**
 * Set of domains which require loading in a top-level frame.
 */
export const EMBED_BLOCKED_DOMAIN_LIST = new Set<string>([
  // Blocked by SameSite cookie
  'www.netflix.com',
  // Cross-origin script errors
  'fmovies.to'
])
