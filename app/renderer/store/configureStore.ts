import * as _configureStore from './configureStore.prod'

let storeModule: any

if (process.env.NODE_ENV === 'production') {
  storeModule = require('./configureStore.prod')
} else {
  storeModule = require('./configureStore.dev')
}

export const history = storeModule.history as typeof _configureStore['history']
export const configureStore = storeModule.configureStore as typeof _configureStore['configureStore']
