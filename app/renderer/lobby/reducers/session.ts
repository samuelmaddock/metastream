import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { NetworkDisconnectReason } from 'constants/network'
import {
  setSessionData,
  setDisconnectReason,
  setAuthorized,
  setConnectionStatus
} from '../actions/session'
import { NetActions } from '../../network/actions'

export const enum ConnectionStatus {
  Connected = 'Connected',
  Pending = 'Pending'
}

export interface ISessionState {
  id: string
  media?: {
    url: string
    title: string
    thumbnail?: string
  }
  users: number
  maxUsers?: number

  /** CLIENT: Reason for disconnect */
  disconnectReason?: NetworkDisconnectReason

  /** CLIENT: Whether they're authorized */
  authorized?: boolean

  /** CLIENT: Connection status. */
  connectionStatus?: ConnectionStatus
}

const initialState: ISessionState = {
  id: '',
  users: 0
}

export const session: Reducer<ISessionState> = (
  state: ISessionState = initialState,
  action: any
) => {
  if (isType(action, setSessionData)) {
    return { ...state, ...action.payload }
  }

  // Client data
  if (isType(action, setDisconnectReason)) {
    return { ...state, disconnectReason: action.payload }
  } else if (isType(action, setAuthorized)) {
    return { ...state, authorized: action.payload, connectionStatus: ConnectionStatus.Connected }
  } else if (isType(action, setConnectionStatus)) {
    return { ...state, connectionStatus: action.payload }
  }

  if (isType(action, NetActions.disconnect)) {
    return initialState
  }

  return state
}

export const getMaxUsers = (state: IAppState) => state.session.maxUsers || Infinity
export const getDisconnectReason = (state: IAppState) => state.session.disconnectReason
