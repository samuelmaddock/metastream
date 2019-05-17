import isIp from 'is-ip'
import { APP_WEBSITE } from 'constants/http';

const P2P_HASH_REGEX = /^[a-fA-F0-9]{64}$/i

export const isP2PHash = (hash: string) => P2P_HASH_REGEX.test(hash)
export const isIP = (ip: string): boolean => isIp(ip)

export const isUrlDomain = (urlStr: string) => {
  let url
  try {
    url = urlStr.indexOf('://') > -1 ? new URL(urlStr) : new URL(`http://${urlStr}`)
  } catch (e) {
    return false
  }
  return url.host === urlStr
}

export const formatSessionPath = (uri: string): string => {
  if (isP2PHash(uri)) return uri

  let url
  try {
    url = new URL(uri)
  } catch {
    return uri
  }

  // Get session hash from /join url
  if (url.origin === APP_WEBSITE || url.origin === location.origin) {
    const { pathname } = url
    const hash = pathname.startsWith('/join/') && pathname.split('/').pop()
    if (hash && isP2PHash(hash)) {
      return hash
    }
  }

  return uri
}
