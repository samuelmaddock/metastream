import en from './en-US'

type LocaleKey = keyof typeof en

/** Translate locale key */
export function t(key: LocaleKey, vars?: { [key: string]: any }) {
  return en[key]
}
