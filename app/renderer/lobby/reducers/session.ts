import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { NetworkDisconnectReason } from 'constants/network'
import { DEFAULT_USERS_MAX } from 'constants/settings'
import { setSessionData, setDisconnectReason, setAuthorized } from '../actions/session'
import { NetActions } from '../../network/actions'

export interface ISessionState {
  maxUsers?: number

  /** CLIENT: Reason for disconnect */
  disconnectReason?: NetworkDisconnectReason

  /** CLIENT: Whether they're authorized */
  authorized?: boolean
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

  if (isType(action, setAuthorized)) {
    return { ...state, authorized: action.payload }
  }

  if (isType(action, NetActions.disconnect)) {
    return initialState
  }

  return state
}

export const getMaxUsers = (state: IAppState) => state.session.maxUsers || Infinity
export const getDisconnectReason = (state: IAppState) => state.session.disconnectReason
