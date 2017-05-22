import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { lobby, ILobbyState } from "reducers/lobby";

export interface IAppState {
  lobby: ILobbyState;
}

const rootReducer = combineReducers({
  router,
  lobby,
});

export default rootReducer;
