import { createMemoryHistory } from 'history'
import { routerMiddleware } from 'connected-react-router'
import { applyMiddleware, compose, createStore, Middleware, DeepPartial } from 'redux'
import thunk from 'redux-thunk'
import { createReducer, IAppState } from '../reducers'

const history = createMemoryHistory()

interface Options {
  initialState?: DeepPartial<IAppState>
}

export const configureTestStore = (opts: Options = {}) => {
  // Redux Configuration
  const middleware: Middleware[] = [thunk]
  const enhancers = []

  // Router Middleware
  const router = routerMiddleware(history)
  middleware.push(router)

  // Apply Middleware & Compose Enhancers
  enhancers.push(applyMiddleware(...middleware))
  const enhancer = compose(...enhancers)

  // Create Store
  const rootReducer = createReducer(history)
  const store = createStore(rootReducer as any, opts.initialState || {}, enhancer as any)

  return store
}
