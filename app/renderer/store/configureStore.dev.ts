import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { createHashHistory } from 'history'
import { routerMiddleware, routerActions } from 'react-router-redux'
import { createLogger } from 'redux-logger'
import { persistStore, persistReducer } from 'redux-persist'
import persistConfig from './persistStore'
import rootReducer from '../reducers'
import { IExtra } from 'types/thunk'
import appMiddleware from 'renderer/store/appMiddleware'

const history = createHashHistory()

const configureStore = (extra: IExtra, initialState?: {}) => {
  // Redux Configuration
  const middleware = []
  const enhancers = []

  // Thunk Middleware
  const thunkMiddleware = thunk.withExtraArgument(extra)
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
  const persistedReducer = persistReducer(persistConfig, rootReducer as any)

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
  const store = createStore(persistedReducer, initialState, enhancer)
  const persistor = persistStore(store)

  if (module.hot) {
    module.hot.accept('../reducers', () => {
      const newReducer = require('../reducers').default
      store.replaceReducer(newReducer)
    })
  }

  return { store, persistor }
}

export { configureStore, history }
