import { isFirefox } from 'utils/browser'

/**
 * Set of domains which require loading in a top-level frame.
 */
export const EMBED_BLOCKED_DOMAIN_LIST = new Set<string>(
  isFirefox()
    ? [
        // Blocked by SameSite cookie
        // Waiting for FF addon to be approved for this fix
        'www.netflix.com'
      ]
    : []
)
