const { remote } = chrome
import {} from 'url'

type QueryParams = { [key: string]: any }

const esc = encodeURIComponent

export const encodeQueryParams = (params: QueryParams): string => {
  return Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&')
}

export function parseQuery(queryString: string) {
  var query: any = {}
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&')
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=')
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

export const openInBrowser = (href: string): void => {
  remote.shell.openExternal(href)
}
