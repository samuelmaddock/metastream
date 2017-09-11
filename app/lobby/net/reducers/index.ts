import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { lobby, ILobbyState } from 'reducers/lobby';
import { Reducer, AnyAction } from 'redux';

import { NetReduxActionTypes } from 'lobby/net/middleware/sync';
import { ReplicatedState } from 'lobby/types';

import { chat, IChatState } from './chat';
import { users, IUsersState } from 'lobby/net/reducers/users';
import { session, ISessionState } from 'lobby/net/reducers/session';

export interface ILobbyNetState {
  chat: IChatState;
  session: ISessionState;
  users: IUsersState;
}

export const LobbyReplicatedState: ReplicatedState<ILobbyNetState> = {
  session: true,
  users: true
};

const rootReducer = combineReducers<ILobbyNetState>({
  chat,
  session,
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
