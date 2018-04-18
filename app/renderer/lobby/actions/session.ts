import { actionCreator } from 'utils/redux'
import { ISessionState } from '../reducers/session'
import { ThunkAction } from 'redux-thunk'
import { IAppState } from '../../reducers/index'
import { hasValidLicense } from '../../license'
import { USERS_MAX_FREE } from 'constants/settings'

export const setSessionData = actionCreator<Partial<ISessionState>>('SET_SESSION_DATA')

export const initHostSession = (): ThunkAction<void, IAppState, void> => {
  return (dispatch, getState) => {
    const maxUsers = hasValidLicense() ? undefined : USERS_MAX_FREE

    dispatch(setSessionData({ maxUsers }))
  }
}
