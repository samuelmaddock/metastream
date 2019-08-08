import { isFirefox } from './browser'

type QueryParams = { [key: string]: any }

const esc = encodeURIComponent

export const encodeQueryParams = (params: QueryParams): string => {
  return Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&')
}

export function parseQuery(queryString: string): { [key: string]: string | undefined } {
  let query: any = {}
  let pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&')
  for (let i = 0; i < pairs.length; i++) {
    let pair = pairs[i].split('=')
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '')
  }
  return query
}

export const buildUrl = (url: string, params: QueryParams): string => {
  return `${url}?${encodeQueryParams(params)}`
}

/** Determine if the string is a valid URL. */
export const isUrl = (str: string): boolean => {
  // TODO: make this more robust
  // maybe use https://www.npmjs.com/package/valid-url
  return str.startsWith('http://') || str.startsWith('https://')
}

export const openInBrowser = (href: string) => {
  if (isFirefox()) {
    window.open(href, '_blank', 'noopener')
  } else {
    const a = document.createElement('a')
    a.href = href
    a.target = '_blank'
    a.click()
  }
}

export const getHost = (url: string) => {
  let urlObj
  try {
    urlObj = new URL(url)
  } catch {
    return null
  }
  return urlObj.host
}
