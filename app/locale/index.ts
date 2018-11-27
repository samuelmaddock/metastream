import i18n, { TranslationFunction } from 'i18next'
import { reactI18nextModule } from 'react-i18next'

import enUS from './en-US'
import deDE from './de_DE'
import ptBR from './pt-BR'

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
  lng: 'en-US',
  fallbackLng: 'en-US',
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
