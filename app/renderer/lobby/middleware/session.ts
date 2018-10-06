import { Middleware } from 'redux'
import { isType } from 'utils/redux'
import { NetActions, NetMiddlewareOptions } from '../../network/actions'
import { initHostSession } from '../actions/session'
import { IAppState } from '../../reducers/index'

export const sessionMiddleware = (): Middleware<{}, IAppState> => {
  return store => {
    const { dispatch, getState } = store

    const init = (options: NetMiddlewareOptions) => {
      if (options.host) {
        dispatch(initHostSession() as any)
      }
    }

    return next => action => {
      if (isType(action, NetActions.connect)) {
        init(action.payload)
      }
      const prevState = getState()
      const result = next(action)
      const state = getState()

      if (state.mediaPlayer) {
        // TODO
      }

      return result
    }
  }
}
