import { CACHE_KEY_NAME } from './consts'
import { Item } from './types'

export const getAppName = (): string => ''

export const getAppVersion = (): string => ''

export const getClientId = (): string => ''

export const getLanguage = (): string => window.navigator.language

export const getUserAgent = (): string => window.navigator.userAgent

export const getViewport = (): string => `${window.innerWidth}x${window.innerHeight}`

export const getScreenResolution = (): string => {
  return ''
}

export const getNow = (): number => Date.now()

export const getCache = (): Item[] => {
  const cache = window.localStorage.getItem(CACHE_KEY_NAME)
  return cache ? JSON.parse(cache) : []
}

export const setCache = (cache: object[]): void => {
  window.localStorage.setItem(CACHE_KEY_NAME, JSON.stringify(cache))
}

export const retry = (cb: Function, schedule: number) => setInterval(cb, schedule)

export const fetch = (url: string, options: RequestInit) => window.fetch(url, options)
