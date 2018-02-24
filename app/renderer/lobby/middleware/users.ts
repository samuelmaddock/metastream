import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux'
import { actionCreator, isType } from 'utils/redux'
import { Platform } from 'renderer/platform/types'
import { PlatformService } from 'renderer/platform'
import { localUser, NetConnection, NetServer } from 'renderer/network'
import { NetMiddlewareOptions, NetActions } from 'renderer/network/actions'
import { RpcThunk } from '../types'
import { rpc, RpcRealm } from '../../network/middleware/rpc'
import { multi_userJoined, multi_userLeft } from '../actions/users'
import { initialize } from 'renderer/lobby/actions/user-init'

interface IUserPayload {
  conn: NetConnection
  name?: string
  host?: boolean
}

export const addUser = actionCreator<IUserPayload>('ADD_USER')
export const removeUser = actionCreator<string>('REMOVE_USER')
export const clearUsers = actionCreator<string>('CLEAR_USERS')

export const usersMiddleware = (): Middleware => {
  return <S extends Object>(store: MiddlewareAPI<S>) => {
    const { dispatch, getState } = store

    let server: NetServer | null, host: boolean

    const init = (options: NetMiddlewareOptions) => {
      server = options.server
      host = options.host

      if (host) {
        // Add local user as initial user
        dispatch(
          addUser({
            conn: localUser(),
            name: PlatformService.getUserName(localUser().id),
            host: true
          })
        )

        server.on('disconnect', (conn: NetConnection) => {
          const id = conn.id.toString()
          dispatch(multi_userLeft(id))
          dispatch(removeUser(id))
        })
      } else {
        server.once('connect', () => {
          dispatch((initialize as any)())
        })
      }
    }

    const destroy = () => {
      server = null
      host = false
      dispatch(clearUsers())
    }

    return (next: Dispatch<S>) => <A extends Action, B>(action: A): B | Action => {
      if (isType(action, NetActions.connect)) {
        init(action.payload)
        return next(<A>action)
      } else if (isType(action, NetActions.disconnect)) {
        destroy()
        return next(<A>action)
      }

      return next(<A>action)
    }
  }
}
