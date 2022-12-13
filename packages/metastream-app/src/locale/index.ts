import i18n, { TranslationFunction, Resource } from 'i18next'
import { reactI18nextModule } from 'react-i18next'

import enUS from './en-US'
import enGB from './en-GB'
import deDE from './de-DE'
import ptBR from './pt-BR'
import huHU from './hu-HU'
import es from './es'
import ru from './ru'
import uk from './uk'
import ja from './ja'
import ar from './ar'
import koKR from './ko-KR'
import frFR from './fr-FR'
import zhCN from './zh-CN'
import zhTW from './zh-TW'
import trTR from './tr-TR'
import itIT from './it-IT'
import pl from './pl'

export const DEFAULT_LANGUAGE = 'en-US'

export const locales = [
  { label: 'English', code: 'en-US', translation: enUS, flag: '🇺🇸' },
  { label: 'English', code: 'en-GB', translation: enGB, flag: '🇬🇧' },
  { label: 'Español', code: 'es-ES', translation: es, flag: '🇪🇸' },
  { label: 'Français', code: 'fr-FR', translation: frFR, flag: '🇫🇷' },
  { label: 'Italiano', code: 'it-IT', translation: itIT, flag: '🇮🇹' },
  { label: 'Pусский', code: 'ru-RU', translation: ru, flag: '🇷🇺' },
  { label: 'Українська', code: 'uk', translation: uk, flag: '🇺🇦' },
  { label: 'Polski', code: 'pl', translation: pl, flag: '🇵🇱' },
  { label: 'Português do Brasil', code: 'pt-BR', translation: ptBR, flag: '🇧🇷' },
  { label: 'Deutsch', code: 'de-DE', translation: deDE, flag: '🇩🇪' },
  { label: 'Türkçe', code: 'tr-TR', translation: trTR, flag: '🇹🇷' },
  { label: 'Magyar', code: 'hu-HU', translation: huHU, flag: '🇭🇺' },
  { label: '日本語', code: 'ja-JP', translation: ja, flag: '🇯🇵' },
  { label: '한국어', code: 'ko-KR', translation: koKR, flag: '🇰🇷' },
  { label: '中文', code: 'zh-CN', translation: zhCN, flag: '🇨🇳' },
  { label: '繁體中文', code: 'zh-TW', translation: zhTW, flag: '🇹🇼' },
  { label: 'العربية الفصحى', code: 'ar', translation: ar, flag: '🇦🇪' }
]

const localeAliases: { [key: string]: string } = {
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
  hu: 'hu-HU',
  ja: 'ja-JP',
  pt: 'pt-BR',
  ru: 'ru-RU',
  fr: 'fr-FR'
}

const resources: Resource = locales.reduce(
  (obj, locale) => ({
    ...obj,
    [locale.code]: {
      translation: locale.translation
    }
  }),
  {}
)

Object.keys(localeAliases).forEach(alias => {
  resources[alias] = resources[localeAliases[alias]]
})

i18n.use(reactI18nextModule).init({
  debug: process.env.NODE_ENV === 'development',
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

export function initLocale(defaultLocale: string = navigator.language) {
  if (process.env.NODE_ENV === 'development') {
    Object.assign((window as any).app, { i18n })
  }

  if (typeof defaultLocale === 'string') {
    setLocale(defaultLocale)
  }
}

export const setLocale = (locale: string) => {
  console.debug(`Setting locale to ${locale}`)
  if (locale !== i18n.language) {
    i18n.changeLanguage(locale)
  }

  const { documentElement } = document
  if (documentElement.lang) {
    documentElement.lang = locale
  }
}
