let storeModule: any

if (process.env.NODE_ENV === 'production') {
  storeModule = require('./configureStore.prod')
} else {
  storeModule = require('./configureStore.dev')
}

export const history = storeModule.history
export const configureStore = storeModule.configureStore
