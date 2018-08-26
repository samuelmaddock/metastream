import React from 'react'
import { render } from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { History } from 'history'

import Root from './containers/Root'
import * as cfgStore from './store/configureStore'

import 'styles/app.global.css'

import { PRODUCT_NAME } from 'constants/app'
import { PlatformService } from 'renderer/platform'
import { initAnalytics } from './analytics/index'

let store: any
let history: History
let persistor: any

function logger() {
  chrome.ipcRenderer.on('log', (event: Electron.Event, payload: { type: string; args: any[] }) => {
    ;(console as any)[payload.type]('[MAIN]', ...payload.args)
  })
}

function init() {
  logger()

  // Set default title
  document.title = PRODUCT_NAME

  history = cfgStore.history
  const storeCfg = cfgStore.configureStore()
  store = storeCfg.store
  persistor = storeCfg.persistor

  initAnalytics(store, history)

  render(
    <AppContainer>
      <Root store={store} history={history} persistor={persistor} />
    </AppContainer>,
    document.getElementById('root')
  )

  // DEBUG
  if (process.env.NODE_ENV === 'development') {
    const app = Object.create(null)
    Object.assign(app, {
      history,
      store,
      platform: PlatformService
    })
    ;(window as any).app = app
  }
}

init()

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root').default as typeof Root
    render(
      <AppContainer>
        <NextRoot store={store} history={history} persistor={persistor} />
      </AppContainer>,
      document.getElementById('root')
    )
  })
}

if (process.env.NODE_ENV === 'development') {
  window.addEventListener('beforeunload', () => {
    debugger
  })
}
