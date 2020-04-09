if (process.env.NODE_ENV === 'development') {
  const app = Object.create(null)
  ;(window as any).app = app
}

import React from 'react'
import { render } from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { History } from 'history'
import { Store } from 'react-redux'
import { IAppState } from 'reducers'
import { Persistor } from 'redux-persist'

import Root from './containers/Root'
import * as cfgStore from './store/configureStore'

import 'styles/app.global.css'

import { PlatformService } from 'platform'
import { initAnalytics } from './analytics'
import { initLocale } from 'locale'
import { setPendingMedia } from 'lobby/actions/mediaPlayer'
import { SEC2MS } from 'utils/math'
import { AccountService } from 'account/account'
import { sleep } from 'utils/async'
import { checkExtensionInstall } from 'actions/ui'

let store: Store<IAppState>
let history: History
let persistor: Persistor

function renderComplete() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    navigator.serviceWorker.register('/service-worker.js')
  }
}

function onMessage(event: MessageEvent) {
  const { data } = event
  if (typeof data !== 'object' || typeof data.type !== 'string') return

  switch (data.type) {
    case 'metastream-extension-request':
      if (typeof data.payload === 'object') {
        const { url, time, source } = data.payload
        store.dispatch(setPendingMedia({ url, time: time ? time * SEC2MS : undefined, source }))
      }
      break
  }
}

function extensionInstalled() {
  store.dispatch(checkExtensionInstall())
}

async function main() {
  history = cfgStore.history

  const storeCfg = cfgStore.configureStore({
    persistCallback: () => {
      const state = store.getState()
      initLocale(state.settings.language)
    }
  })

  store = storeCfg.store
  persistor = storeCfg.persistor

  // setup listeners
  window.addEventListener('message', onMessage, false)
  document.addEventListener('metastreamRemoteInstalled', extensionInstalled)

  // fix: sometimes the extension installs too late and the app misses its check
  // this can be removed after Metastream Remote v0.4.2 is released
  setTimeout(extensionInstalled, 3e3)

  try {
    await Promise.race([
      AccountService.get().checkLogin(),
      sleep(15e3) // skip on timeout
    ])
  } catch (e) {
    console.error(e)
  }

  // Setup libsodium and cryptographic identity
  await PlatformService.get().ready

  initAnalytics(store, history)

  // DEBUG
  if (process.env.NODE_ENV === 'development') {
    Object.assign((window as any).app, {
      history,
      store,
      platform: PlatformService.get()
    })
  }

  render(
    <AppContainer>
      <Root store={store} history={history} persistor={persistor} />
    </AppContainer>,
    document.getElementById('root'),
    renderComplete
  )
}

main()

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

// if (process.env.NODE_ENV === 'development') {
//   window.addEventListener('beforeunload', () => {
//     debugger
//   })
// }
