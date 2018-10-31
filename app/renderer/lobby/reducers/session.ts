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
import { resetLobby } from '../actions/common'

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
  startTime?: number
  users: number
  maxUsers?: number

  /**
   * Unique secret generated per session.
   * Used by Discord game invites.
   */
  secret: string

  /** CLIENT: Reason for disconnect */
  disconnectReason?: NetworkDisconnectReason

  /** CLIENT: Whether they're authorized */
  authorized?: boolean

  /** CLIENT: Connection status. */
  connectionStatus?: ConnectionStatus
}

const initialState: ISessionState = {
  id: '',
  users: 0,
  startTime: new Date().getTime(),
  secret: ''
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

  if (isType(action, resetLobby)) {
    return initialState
  }

  return state
}

export const getMaxUsers = (state: IAppState) => state.session.maxUsers || Infinity
export const getDisconnectReason = (state: IAppState) => state.session.disconnectReason
