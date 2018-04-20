import { ThunkAction } from 'redux-thunk'
import { IAppState } from 'renderer/reducers'
import { PlatformService } from 'renderer/platform'
import { addUser } from 'renderer/lobby/middleware/users'
import { localUser } from 'renderer/network'
import { RpcThunk } from 'renderer/lobby/types'
import { multi_userJoined } from 'renderer/lobby/actions/users'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { getUser, getNumUsers } from 'renderer/lobby/reducers/users'
import { updateServerTimeDelta } from 'renderer/lobby/actions/clock'
import { getLocalUsername, getLocalColor } from '../../reducers/settings'
import { USERNAME_MAX_LEN, COLOR_LEN } from 'constants/settings'
import { getMaxUsers } from '../reducers/session'
import { NetworkDisconnectReason } from 'constants/network'
import { setDisconnectReason, setAuthorized } from './session'

const { version } = require('package.json')

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
  return (dispatch, getState) => {
    dispatch(
      server_initClient({
        version,
        name: getLocalUsername(getState()),
        color: getLocalColor(getState())
      })
    )
  }
}

const validateClientInfo = (info: ClientInfo, id: string, state: IAppState) => {
  if (version !== info.version) {
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

const kickClient = (reason: NetworkDisconnectReason | string): RpcThunk<void> => (
  dispatch,
  getState
) => {
  console.debug(`Received kick with reason: '${reason}'`)
  dispatch(setDisconnectReason(reason))
}
const client_kick = rpc(RpcRealm.Client, kickClient)

const clientAuthorized = (info: AuthorizeInfo): RpcThunk<void> => (dispatch, getState) => {
  // TODO: take average of multiple samples?
  const dt = Date.now() - info.serverTime
  dispatch(updateServerTimeDelta(dt))
  dispatch(setAuthorized(true))
}
const client_authorized = rpc(RpcRealm.Client, clientAuthorized)

const initClient = (info: ClientInfo): RpcThunk<void> => (dispatch, getState, { client }) => {
  const state = getState()
  const id = client.id.toString()

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

  dispatch(
    addUser({
      conn: client,
      name: info.name,
      color: info.color
    })
  )

  dispatch(multi_userJoined(id))

  dispatch(client_authorized({
    serverTime: Date.now()
  })(id))
}
const server_initClient = rpc(RpcRealm.Server, initClient)
