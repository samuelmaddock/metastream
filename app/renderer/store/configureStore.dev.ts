import { createHashHistory } from 'history'
import { routerActions, routerMiddleware } from 'react-router-redux'
import { applyMiddleware, compose, createStore } from 'redux'
import { createLogger } from 'redux-logger'
import { persistReducer, persistStore } from 'redux-persist'
import thunk from 'redux-thunk'
import appMiddleware from 'renderer/store/appMiddleware'
import rootReducer from '../reducers'
import persistConfig from './persistStore'
import { ConfigureStoreOptions } from './types'

const history = createHashHistory()

const configureStore = (opts: ConfigureStoreOptions) => {
  // Redux Configuration
  const middleware = []
  const enhancers = []

  // Thunk Middleware
  const thunkMiddleware = thunk.withExtraArgument(opts.extra)
  middleware.push(thunkMiddleware)

  // App Middleware
  middleware.push(...appMiddleware)

  // Logging Middleware
  const logger = createLogger({
    level: 'info',
    collapsed: true
  })
  middleware.push(logger)

  // Router Middleware
  const router = routerMiddleware(history)
  middleware.push(router)

  // Persist Middleware
  const persistedReducer = persistReducer<any, any>(persistConfig, rootReducer)

  // Redux DevTools Configuration
  const actionCreators = {
    ...routerActions
  }
  // If Redux DevTools Extension is installed use it, otherwise use Redux compose
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        // Options: http://zalmoxisus.github.io/redux-devtools-extension/API/Arguments.html
        actionCreators
      })
    : compose

  // Apply Middleware & Compose Enhancers
  enhancers.push(applyMiddleware(...middleware))
  const enhancer = composeEnhancers(...enhancers)

  // Create Store
  const store = createStore(persistedReducer, opts.initialState || {}, enhancer)
  const persistor = persistStore(store, undefined, opts.persistCallback)

  if (module.hot) {
    module.hot.accept('../reducers', () => {
      const newReducer = require('../reducers').default
      store.replaceReducer(newReducer)
    })
  }

  return { store, persistor }
}

export { configureStore, history }
