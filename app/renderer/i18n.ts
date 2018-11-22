import i18n from 'i18next'
import { reactI18nextModule } from 'react-i18next'

import enUS from '../locale/en-US'
import deDE from '../locale/de_DE'
import ptBR from '../locale/pt-BR'

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

export default i18n
