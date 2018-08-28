import { ThunkAction } from 'redux-thunk'
import { IAppState } from 'renderer/reducers'
import { addUser } from 'renderer/lobby/middleware/users'
import { RpcThunk } from 'renderer/lobby/types'
import { multi_userJoined, client_kick } from 'renderer/lobby/actions/users'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { getUser, getNumUsers } from 'renderer/lobby/reducers/users.helpers'
import {
  getLocalUsername,
  getLocalColor,
  getLocalSessionMode,
  SessionMode
} from 'renderer/reducers/settings'
import { USERNAME_MAX_LEN, COLOR_LEN } from 'constants/settings'
import { getMaxUsers } from '../reducers/session'
import { NetworkDisconnectReason } from 'constants/network'
import { setAuthorized } from './session'
import { updateServerClockSkew } from './mediaPlayer'
import { VERSION } from 'constants/app'
import { NetConnection } from '../../network/index'
import { addChat } from './chat'

type ClientInfo = {
  name: string
  color: string
  version: string
}

type AuthorizeInfo = {
  serverTime: number
}

/** Initialize client */
export const initialize = (): ThunkAction<void, IAppState, void> => {
  return async (dispatch, getState) => {
    dispatch(
      server_initClient({
        version: VERSION,
        name: getLocalUsername(getState()),
        color: getLocalColor(getState())
      })
    )
  }
}

const validateClientInfo = (info: ClientInfo, id: string, state: IAppState) => {
  if (VERSION !== info.version) {
    console.debug(`Client '${info.version}'[${id}] kicked for version mismatch (${info.version})`)
    return NetworkDisconnectReason.VersionMismatch
  }

  const existingUser = !!getUser(state, id)

  if (existingUser) {
    console.debug(`Client with existing ID already active in session ${id}`)
    return NetworkDisconnectReason.InvalidClientInfo
  }

  if (!info.name || info.name.length > USERNAME_MAX_LEN) {
    console.debug(`Client ${id} kicked for name overflow (${info.name})`)
    return NetworkDisconnectReason.InvalidClientInfo
  }

  if (!info.color || info.color.length !== COLOR_LEN) {
    console.debug(`Client ${id} kicked for invalid color (${info.color})`)
    return NetworkDisconnectReason.InvalidClientInfo
  }

  return true
}

const clientAuthorized = (info: AuthorizeInfo): RpcThunk<void> => (dispatch, getState) => {
  // TODO: take average of multiple samples?
  const dt = Date.now() - info.serverTime
  dispatch(updateServerClockSkew(dt))
  dispatch(setAuthorized(true))
}
const client_authorized = rpc(RpcRealm.Client, clientAuthorized)

const initClient = (info: ClientInfo): RpcThunk<void> => (dispatch, getState, { client }) => {
  const state = getState()
  const id = client.id.toString()

  console.debug(`Received client info for ${id}`, info)

  let reason

  const validOrReason = validateClientInfo(info, id, state)
  if (validOrReason !== true) {
    reason = validOrReason
  } else if (getNumUsers(state) >= getMaxUsers(state)) {
    reason = NetworkDisconnectReason.Full
  }

  if (reason) {
    dispatch(client_kick(reason)(id))
    client.close()
    return
  }

  const sessionMode = getLocalSessionMode(state)
  const shouldAwaitAuthorization = sessionMode === SessionMode.Request

  dispatch(
    addUser({
      conn: client,
      name: info.name,
      color: info.color,
      pending: shouldAwaitAuthorization
    })
  )

  if (shouldAwaitAuthorization) {
    dispatch(
      addChat({ content: `${info.name} is requesting permission to join.`, timestamp: Date.now() })
    )
    return
  }

  dispatch(authorizeClient(client))
}
const server_initClient = rpc(RpcRealm.Server, initClient, {
  allowUnauthed: true
})

export const authorizeClient = (client: NetConnection): ThunkAction<void, IAppState, void> => {
  return async (dispatch, getState) => {
    const id = client.id.toString()
    dispatch(multi_userJoined(id))

    // Client has been fully authorized
    client.auth()

    dispatch(client_authorized({ serverTime: Date.now() })(id))
  }
}
