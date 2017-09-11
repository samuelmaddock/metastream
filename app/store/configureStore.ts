let store: any;

if (process.env.NODE_ENV === 'production') {
  store = require('./configureStore.prod');
} else {
  store = require('./configureStore.dev');
}

export const history = store.history;
export const configureStore = store.configureStore;
