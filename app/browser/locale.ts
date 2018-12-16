import { app, ipcMain } from 'electron'
import { REQUEST_LANGUAGE, LANGUAGE } from 'constants/ipc'
import { DEFAULT_LANGUAGE } from 'locale'

function getDefaultLocale() {
  if (app.getLocale()) {
    var lang = app.getLocale().replace('_', '-')
    if (!lang.match(/-/)) {
      lang = lang + '-' + lang.toUpperCase()
    }
    return lang
  }
  return DEFAULT_LANGUAGE
}

export function initLocale() {
  ipcMain.on(REQUEST_LANGUAGE, (e: Electron.Event) => {
    const lang = getDefaultLocale()
    e.sender.send(LANGUAGE, lang)
  })
}
