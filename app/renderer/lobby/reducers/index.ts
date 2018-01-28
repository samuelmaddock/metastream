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

export interface ILobbyNetState {
  chat: IChatState;
  mediaPlayer: IMediaPlayerState;
  session: ISessionState;
  users: IUsersState;
}

export const lobbyReducers = {
  chat,
  mediaPlayer,
  session,
  users
};
