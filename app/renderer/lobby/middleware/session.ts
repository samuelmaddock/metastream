import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux'
import { NetServer, NetConnection, localUser } from 'renderer/network'
import { actionCreator, isType } from 'utils/redux'
import { Platform } from 'renderer/platform/types'
import { PlatformService } from 'renderer/platform'
import { NetActions, NetMiddlewareOptions } from '../../network/actions'
import { initHostSession } from '../actions/session';

export const sessionMiddleware = (): Middleware => {
  return <S extends Object>(store: MiddlewareAPI<S>) => {
    const { dispatch, getState } = store

    const init = (options: NetMiddlewareOptions) => {
      if (options.host) {
        dispatch(initHostSession() as any)
      }
    }

    return (next: Dispatch<S>) => <A extends Action, B>(action: A): B | Action => {
      if (isType(action, NetActions.connect)) {
        init(action.payload)
      }
      return next(<A>action)
    }
  }
}
