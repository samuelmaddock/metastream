import i18n, { TranslationFunction, Resource } from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import { ipcRenderer } from 'electron'

import enUS from './en-US'
import deDE from './de-DE'
import ptBR from './pt-BR'
import huHU from './hu-HU'
import es from './es'
import { REQUEST_LANGUAGE, LANGUAGE } from 'constants/ipc'

export const DEFAULT_LANGUAGE = 'en-US'

export const locales = [
  { label: 'Deutsch', code: 'de-DE', translation: deDE, flag: '🇭🇺' },
  { label: 'English', code: 'en-US', translation: enUS, flag: '🇺🇸' },
  { label: 'Español', code: 'es-ES', translation: es, flag: '🇪🇸' },
  { label: 'Português do Brasil', code: 'pt-BR', translation: ptBR, flag: '🇧🇷' },
  { label: 'Magyar', code: 'hu-HU', translation: huHU, flag: '🇭🇺' }
]

const resources: Resource = locales.reduce(
  (obj, locale) => ({
    ...obj,
    [locale.code]: {
      translation: locale.translation
    }
  }),
  {}
)

resources.es = resources['es-ES']

i18n.use(reactI18nextModule).init({
  debug: process.env.NODE_ENV === 'development' && process.type === 'renderer',
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  keySeparator: false, // we do not use keys in form messages.welcome
  interpolation: {
    escapeValue: false // react already safes from xss
  }
})

type keys = keyof typeof enUS
export const t: TranslationFunction<any, object, keys> = i18n.t.bind(i18n)

export const translateEscaped: typeof t = (key, vars) => {
  return t(key, {
    ...vars,
    interpolation: {
      escapeValue: true
    }
  })
}

export function initLocale(defaultLocale?: string) {
  if (process.env.NODE_ENV === 'development') {
    Object.assign((window as any).app, { i18n })
  }

  if (typeof defaultLocale === 'string') {
    setLocale(defaultLocale)
  } else {
    ipcRenderer.on(LANGUAGE, (e: Electron.Event, lang: string) => {
      if (typeof lang === 'string') {
        setLocale(lang)
      }
    })
    ipcRenderer.send(REQUEST_LANGUAGE)
  }
}

export const setLocale = (locale: string) => {
  console.debug(`Setting locale to ${locale}`)
  if (locale !== i18n.language) {
    i18n.changeLanguage(locale)
  }
}
