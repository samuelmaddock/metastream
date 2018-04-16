import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { DEFAULT_USERS_MAX } from 'constants/settings'
import { setSessionData } from '../actions/session';

export interface ISessionState {
  maxUsers: number
}

const initialState: ISessionState = {
  maxUsers: DEFAULT_USERS_MAX
}

export const session: Reducer<ISessionState> = (
  state: ISessionState = initialState,
  action: any
) => {
  if (isType(action, setSessionData)) {
    return { ...state, ...action.payload }
  }

  return state
}

export const getMaxUsers = (state: IAppState) => state.session.maxUsers
