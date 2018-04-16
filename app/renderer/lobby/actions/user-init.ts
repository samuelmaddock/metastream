import { ThunkAction } from 'redux-thunk'
import { IAppState } from 'renderer/reducers'
import { PlatformService } from 'renderer/platform'
import { addUser } from 'renderer/lobby/middleware/users'
import { localUser } from 'renderer/network'
import { RpcThunk } from 'renderer/lobby/types'
import { multi_userJoined } from 'renderer/lobby/actions/users'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { getUser, getNumUsers } from 'renderer/lobby/reducers/users'
import { syncServerTime } from 'renderer/lobby/actions/clock'
import { getLocalUsername, getLocalColor } from '../../reducers/settings'
import { USERNAME_MAX_LEN, COLOR_LEN } from 'constants/settings'
import { getMaxUsers } from '../reducers/session';

const { version } = require('package.json')

type ClientInfo = {
  name: string
  color: string
  version: string
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
    return false
  }

  const existingUser = !!getUser(state, id)

  if (existingUser) {
    console.debug(`Client with existing ID already active in session ${id}`)
    return false
  }

  if (!info.name || info.name.length > USERNAME_MAX_LEN) {
    console.debug(`Client ${id} kicked for name overflow (${info.name})`)
    return false
  }

  if (!info.color || info.color.length !== COLOR_LEN) {
    console.debug(`Client ${id} kicked for invalid color (${info.color})`)
    return false
  }

  return true
}

const initClient = (info: ClientInfo): RpcThunk<void> => (dispatch, getState, { client }) => {
  const state = getState()
  const id = client.id.toString()

  // TODO: send disconnect reason to client
  if (!validateClientInfo(info, id, state)) {
    client.close()
    return
  }

  if (getNumUsers(state) >= getMaxUsers(state)) {
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
  dispatch(syncServerTime())
}
const server_initClient = rpc(RpcRealm.Server, initClient)
