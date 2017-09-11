import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { lobby, ILobbyState } from 'reducers/lobby';
import { Reducer, AnyAction } from 'redux';

import { NetReduxActionTypes } from 'lobby/net/middleware/sync';
import { ReplicatedState } from 'lobby/types';

import { chat, IChatState } from './chat';
import { users, IUsersState } from 'lobby/net/reducers/users';

export interface ILobbyNetState {
  chat: IChatState;
  users: IUsersState;
}

export const LobbyReplicatedState: ReplicatedState<ILobbyNetState> = {
  users: true
};

const rootReducer = combineReducers<ILobbyNetState>({
  chat,
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
