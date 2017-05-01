let store: any;

if (process.env.NODE_ENV === 'production') {
	store = require('./configureStore.production');
} else {
	store = require('./configureStore.development');
}

// TODO: redux thunk doesn't use 'default' prop?
console.log('store', store);

const {history, configureStore} = store;

export {history, configureStore};
