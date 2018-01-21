import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { lobby, ILobbyState } from 'renderer/reducers/lobby';
import { Reducer, AnyAction } from 'redux';

import { ReplicatedState } from 'renderer/network/types';
import { NetReduxActionTypes } from 'renderer/network/middleware/sync';

import { chat, IChatState } from './chat';
import { users, IUsersState } from './users';
import { session, ISessionState } from './session';
import { mediaPlayer, IMediaPlayerState } from './mediaPlayer';
import { settings, ISettingsState } from './settings';
import { ui, IUIState } from 'renderer/lobby/reducers/ui';

export interface ILobbyNetState {
  chat: IChatState;
  mediaPlayer: IMediaPlayerState;
  session: ISessionState;
  settings: ISettingsState;
  ui: IUIState;
  users: IUsersState;
}

export const LobbyReplicatedState: ReplicatedState<ILobbyNetState> = {
  mediaPlayer: true,
  session: true,
  users: true
};

const rootReducer = combineReducers<ILobbyNetState>({
  chat,
  mediaPlayer,
  session,
  settings,
  ui,
  users
});

const reducer = (state: ILobbyNetState, action: AnyAction): ILobbyNetState => {
  // HACK: force re-render on network update
  if (action.type === NetReduxActionTypes.UPDATE) {
    return { ...state };
  }
  return rootReducer(state, action);
};

export default reducer;
