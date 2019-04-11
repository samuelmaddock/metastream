import isIp from 'is-ip'

const P2P_HASH_REGEX = /[a-fA-F0-9]{64}/i

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
