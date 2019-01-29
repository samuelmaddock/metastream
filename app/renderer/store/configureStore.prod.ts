import { createMemoryHistory } from 'history'
import { routerMiddleware } from 'react-router-redux'
import { applyMiddleware, createStore } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import thunk from 'redux-thunk'
import appMiddleware from 'renderer/store/appMiddleware'
import rootReducer, { IAppState } from '../reducers'
import persistConfig from './persistStore'
import { ConfigureStoreOptions } from './types'

// Use memory history to disable app navigation commands (#11)
const history = createMemoryHistory()

function configureStore(opts: ConfigureStoreOptions) {
  const thunkMiddleware = thunk.withExtraArgument(opts.extra)

  // Persist Middleware
  const persistedReducer = persistReducer<any, any>(persistConfig, rootReducer)

  const router = routerMiddleware(history)
  const enhancer = applyMiddleware(thunkMiddleware, ...appMiddleware, router)

  const store = createStore(persistedReducer, opts.initialState || {}, enhancer)
  const persistor = persistStore(store, undefined, opts.persistCallback)

  return { store, persistor }
}

export { configureStore, history }
