import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { lobby, ILobbyState } from 'reducers/lobby';
import { Reducer } from 'redux';

export interface IAppState {
  lobby: ILobbyState;
}

const rootReducer = combineReducers<IAppState>({
  router: router as Reducer<any>,
  lobby
});

export default rootReducer;
