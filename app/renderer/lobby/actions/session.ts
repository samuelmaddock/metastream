import shortid from 'shortid'
import { actionCreator } from 'utils/redux'
import { ISessionState, ConnectionStatus } from '../reducers/session'
import { NetworkDisconnectReason } from 'constants/network'
import { AppThunkAction } from 'types/redux-thunk'
import { localUserId } from '../../network/index'
import { cleanObject } from 'utils/object'

export const setSessionData = actionCreator<Partial<ISessionState>>('SET_SESSION_DATA')
export const setDisconnectReason = actionCreator<NetworkDisconnectReason | undefined>(
  'SET_DISCONNECT_REASON'
)
export const setAuthorized = actionCreator<boolean>('SET_AUTHORIZED')
export const setConnectionStatus = actionCreator<ConnectionStatus | undefined>(
  'SET_CONNECTION_STATUS'
)

export const initHostSession = (): AppThunkAction => {
  return (dispatch, getState) => {
    const state = getState()
    const sessionData = cleanObject({
      id: localUserId(),
      secret: btoa(shortid()),
      maxUsers: state.settings.maxUsers
    })
    dispatch(setSessionData(sessionData))
  }
}
