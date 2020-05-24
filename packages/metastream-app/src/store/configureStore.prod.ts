import { createBrowserHistory } from 'history'
import { routerMiddleware } from 'connected-react-router'
import { applyMiddleware, createStore } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import thunk from 'redux-thunk'
import { configureAppMiddleware } from 'store/appMiddleware'
import { createReducer } from '../reducers'
import persistConfig from './persistStore'
import { ConfigureStoreOptions } from './types'

const history = createBrowserHistory()

function configureStore(opts: ConfigureStoreOptions) {
  const thunkMiddleware = thunk.withExtraArgument(opts.extra)

  // Persist Middleware
  const persistedReducer = persistReducer<any, any>(persistConfig, createReducer(history))

  const router = routerMiddleware(history)
  const enhancer = applyMiddleware(thunkMiddleware, ...configureAppMiddleware(opts), router)

  const store = createStore(persistedReducer, opts.initialState || {}, enhancer)
  const persistor = persistStore(store, undefined, opts.persistCallback)

  return { store, persistor }
}

export { configureStore, history }
