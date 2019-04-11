import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'reducers'
import { NetworkDisconnectReason } from 'constants/network'
import {
  setSessionData,
  setDisconnectReason,
  setAuthorized,
  setConnectionStatus
} from '../actions/session'
import { resetLobby } from '../actions/common'
import { ReplicatedState } from 'network/types'
import { updateServerClockSkew } from '../actions/mediaPlayer'
import { PlaybackState } from './mediaPlayer'
import { DEFAULT_USERS_MAX, MAX_USERS_INFINITE } from 'constants/settings'

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
  playback: PlaybackState
  startTime?: number
  users: number
  maxUsers: number

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

  /** CLIENT: Clock time difference between client and server. */
  serverClockSkew: number
}

export const sessionReplicatedState: ReplicatedState<ISessionState> = {
  id: true,
  media: true,
  playback: true,
  startTime: true,
  users: true,
  secret: true
}

const initialState: ISessionState = {
  id: '',
  users: 0,
  playback: PlaybackState.Idle,
  startTime: new Date().getTime(),
  secret: '',
  serverClockSkew: 0,
  maxUsers: DEFAULT_USERS_MAX
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
  } else if (isType(action, updateServerClockSkew)) {
    return { ...state, serverClockSkew: action.payload }
  }

  if (isType(action, resetLobby)) {
    return initialState
  }

  return state
}

export const getMaxUsers = (state: IAppState) =>
  state.session.maxUsers === MAX_USERS_INFINITE ? Infinity : state.session.maxUsers
export const getDisconnectReason = (state: IAppState) => state.session.disconnectReason
