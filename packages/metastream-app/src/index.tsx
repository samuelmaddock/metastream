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
        const { url, time } = data.payload
        store.dispatch(setPendingMedia({ url, time: time ? time * SEC2MS : undefined }))
      }
      break
  }
}

async function init() {
  history = cfgStore.history

  const storeCfg = cfgStore.configureStore({
    persistCallback: () => {
      const state = store.getState()
      initLocale(state.settings.language)
    }
  })

  store = storeCfg.store
  persistor = storeCfg.persistor

  // DEBUG
  if (process.env.NODE_ENV === 'development') {
    Object.assign((window as any).app, {
      history,
      store,
      platform: PlatformService
    })
  }

  // Setup libsodium and cryptographic identity
  await PlatformService.ready

  initAnalytics(store, history)
  window.addEventListener('message', onMessage, false)

  render(
    <AppContainer>
      <Root store={store} history={history} persistor={persistor} />
    </AppContainer>,
    document.getElementById('root'),
    renderComplete
  )
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

// if (process.env.NODE_ENV === 'development') {
//   window.addEventListener('beforeunload', () => {
//     debugger
//   })
// }
