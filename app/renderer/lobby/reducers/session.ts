import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { NetworkDisconnectReason } from 'constants/network'
import { DEFAULT_USERS_MAX } from 'constants/settings'
import { setSessionData, setDisconnectReason } from '../actions/session'

export interface ISessionState {
  maxUsers?: number
  disconnectReason?: NetworkDisconnectReason | string
}

const initialState: ISessionState = {}

export const session: Reducer<ISessionState> = (
  state: ISessionState = initialState,
  action: any
) => {
  if (isType(action, setSessionData)) {
    return { ...state, ...action.payload }
  }

  if (isType(action, setDisconnectReason)) {
    return { ...state, disconnectReason: action.payload }
  }

  return state
}

export const getMaxUsers = (state: IAppState) => state.session.maxUsers || Infinity
export const getDisconnectReason = (state: IAppState) => state.session.disconnectReason
