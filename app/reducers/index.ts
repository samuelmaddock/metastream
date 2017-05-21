import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';

export interface IAppState {

}

const rootReducer = combineReducers({
  router,
});

export default rootReducer;
