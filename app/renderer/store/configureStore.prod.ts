import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
// import { createBrowserHistory } from 'history';
import { createHashHistory } from 'history';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from '../reducers';
import { IExtra } from 'types/thunk';

// const history = createBrowserHistory();
const history = createHashHistory();

function configureStore(extra: IExtra, initialState?: {}) {
  const thunkMiddleware = thunk.withExtraArgument(extra);

  const router = routerMiddleware(history);
  const enhancer = applyMiddleware(thunkMiddleware, router);

  return createStore(rootReducer, initialState, enhancer);
}

export { configureStore, history };
