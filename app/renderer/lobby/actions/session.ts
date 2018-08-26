import { actionCreator } from 'utils/redux'
import { ISessionState } from '../reducers/session'
import { ThunkAction } from 'redux-thunk'
import { IAppState } from '../../reducers/index'
import { NetworkDisconnectReason } from 'constants/network'

export const setSessionData = actionCreator<Partial<ISessionState>>('SET_SESSION_DATA')
export const setDisconnectReason = actionCreator<NetworkDisconnectReason | undefined>(
  'SET_DISCONNECT_REASON'
)
export const setAuthorized = actionCreator<boolean>('SET_AUTHORIZED')

export const initHostSession = (): ThunkAction<void, IAppState, void> => {
  return (dispatch, getState) => {
    // TODO(sam): Add option to set max users
    const maxUsers = undefined

    dispatch(setSessionData({ maxUsers }))
  }
}
