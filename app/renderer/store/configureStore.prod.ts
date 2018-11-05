import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { persistStore, persistReducer } from 'redux-persist'
import persistConfig from './persistStore'
import { createMemoryHistory } from 'history'
import { routerMiddleware } from 'react-router-redux'
import rootReducer, { IAppState } from '../reducers'
import { IExtra } from 'types/thunk'
import appMiddleware from 'renderer/store/appMiddleware'

// Use memory history to disable app navigation commands (#11)
const history = createMemoryHistory()

function configureStore(extra: IExtra, initialState: {} = {}) {
  const thunkMiddleware = thunk.withExtraArgument(extra)

  // Persist Middleware
  const whitelist: (keyof IAppState)[] = ['mediaPlayer', 'settings']
  const persistedReducer = persistReducer<any, any>(persistConfig, rootReducer)

  const router = routerMiddleware(history)
  const enhancer = applyMiddleware(thunkMiddleware, ...appMiddleware, router)

  const store = createStore(persistedReducer, initialState, enhancer)
  const persistor = persistStore(store)

  return { store, persistor }
}

export { configureStore, history }
