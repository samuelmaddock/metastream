import i18n, { TranslationFunction } from 'i18next'
import { reactI18nextModule } from 'react-i18next'

import enUS from './en-US'
import deDE from './de_DE'
import ptBR from './pt-BR'
import { REQUEST_LANGUAGE, LANGUAGE } from 'constants/ipc'

export const DEFAULT_LANGUAGE = 'en-US'

const resources = {
  'de-DE': {
    translation: deDE
  },
  'en-US': {
    translation: enUS
  },
  'pt-BR': {
    translation: ptBR
  }
}

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

export function initLocale() {
  const { ipcRenderer } = chrome
  ipcRenderer.on(LANGUAGE, (e: Electron.Event, lang: string) => {
    console.debug(`Setting language to ${lang}`)
    if (lang !== i18n.language) {
      i18n.changeLanguage(lang)
    }
  })
  ipcRenderer.send(REQUEST_LANGUAGE)

  if (process.env.NODE_ENV === 'development') {
    Object.assign((window as any).app, { i18n })
  }
}
