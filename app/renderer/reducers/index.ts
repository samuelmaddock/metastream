import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { Reducer } from 'redux';

import { lobby, ILobbyState } from './lobby';
import { settings, ISettingsState } from './settings';
import { ui, IUIState } from './ui';

import { ILobbyNetState, lobbyReducers } from '../lobby/reducers'
import { AnyAction } from 'redux';
import { NetReduxActionTypes } from 'renderer/network/middleware/sync';
import { ReplicatedState } from 'renderer/network/types';

export interface IAppState extends ILobbyNetState {
  lobby: ILobbyState;
  settings: ISettingsState;
  ui: IUIState;
}

export const AppReplicatedState: ReplicatedState<IAppState> = {
  mediaPlayer: true,
  session: true,
  users: true
};

const rootReducer = combineReducers<IAppState>({
  router: router as Reducer<any>,
  lobby, // TODO: rename to 'servers'?
  ...lobbyReducers,
  settings,
  ui
});

const reducer = (state: IAppState, action: AnyAction): IAppState => {
  // HACK: force re-render on network update
  if (action.type === NetReduxActionTypes.UPDATE) {
    return { ...state };
  }
  return rootReducer(state, action);
};

export default reducer;
