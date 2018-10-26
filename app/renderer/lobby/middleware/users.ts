import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux'
import { actionCreator, isType } from 'utils/redux'
import { localUser, NetConnection, NetServer } from 'renderer/network'
import { NetMiddlewareOptions, NetActions } from 'renderer/network/actions'
import { multi_userLeft } from '../actions/users'
import { initialize } from 'renderer/lobby/actions/user-init'
import {
  getLocalUsername,
  getLocalColor,
  getLocalAvatar,
  resolveLocalAvatar
} from '../../reducers/settings'
import { IAppState } from '../../reducers/index'
import { initLobby } from '../actions/common'

interface IUserPayload {
  conn: NetConnection
  name?: string
  avatar?: string
  color: string

  /** Whether this user is the host. */
  host?: boolean

  /** Whether this user is still pending joining. */
  pending?: boolean
}

export const addUser = actionCreator<IUserPayload>('ADD_USER')
export const removeUser = actionCreator<string>('REMOVE_USER')
export const clearUsers = actionCreator<string>('CLEAR_USERS')

export const usersMiddleware = (): Middleware => {
  return store => {
    const { dispatch, getState } = store

    let server: NetServer | null, host: boolean

    const onDisconnect = (conn: NetConnection) => {
      const id = conn.id.toString()
      if (conn.isAuthed()) {
        dispatch(multi_userLeft(id) as any)
      }
      dispatch(removeUser(id))
    }

    const initHost = async () => {
      const state = (getState() as any) as IAppState

      // Add local user as initial user
      dispatch(
        addUser({
          conn: localUser(),
          host: true,
          name: getLocalUsername(state),
          avatar: resolveLocalAvatar(state),
          color: getLocalColor(state)
        })
      )
    }

    const init = async (options: NetMiddlewareOptions) => {
      server = options.server
      host = options.host

      if (host) {
        server.on('disconnect', onDisconnect)
      } else {
        dispatch((initialize as any)(server))
      }
    }

    const destroy = () => {
      if (server) {
        server.removeListener('disconnect', onDisconnect)
      }
      server = null
      host = false
    }

    return next => action => {
      if (isType(action, initLobby) && action.payload.host) {
        initHost()
        return next(action)
      } else if (isType(action, NetActions.connect)) {
        init(action.payload)
        return next(action)
      } else if (isType(action, NetActions.disconnect)) {
        destroy()
        return next(action)
      }

      return next(action)
    }
  }
}
