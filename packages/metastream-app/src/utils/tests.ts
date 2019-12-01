import { createMemoryHistory } from 'history'
import { routerMiddleware } from 'react-router-redux'
import { applyMiddleware, compose, createStore, Middleware } from 'redux'
import thunk from 'redux-thunk'
import rootReducer, { IAppState } from '../reducers'

const history = createMemoryHistory()

export const configureTestStore = () => {
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
  const store = createStore(rootReducer as any, {}, enhancer as any)

  return store
}
