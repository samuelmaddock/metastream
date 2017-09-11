import { Reducer } from 'redux';
import { isType } from 'utils/redux';
import { ILobbyNetState } from 'lobby/net/reducers';
import { ILobbyData, SessionKey } from 'platform/types';
import { setSessionData } from 'lobby/net/middleware/session';

export type ISessionState = ILobbyData;

const initialState: ISessionState = {};

export const session: Reducer<ISessionState> = (
  state: ISessionState = initialState,
  action: any
) => {
  if (isType(action, setSessionData)) {
    return action.payload;
  }

  return state;
};

export const getSessionName = (state: ILobbyNetState): string | undefined => {
  return state.session[SessionKey.Name];
};
