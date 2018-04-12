import { ThunkAction } from 'redux-thunk'
import { IAppState } from 'renderer/reducers'
import { PlatformService } from 'renderer/platform'
import { addUser } from 'renderer/lobby/middleware/users'
import { localUser } from 'renderer/network'
import { RpcThunk } from 'renderer/lobby/types'
import { multi_userJoined } from 'renderer/lobby/actions/users'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { getUser } from 'renderer/lobby/reducers/users'
import { syncServerTime } from 'renderer/lobby/actions/clock'
import { getLocalUsername } from '../../reducers/settings';
import { USERNAME_MAX_LEN } from '../../../constants/settings';

const { version } = require('package.json')

type ClientInfo = {
  name: string
  version: string
}

/** Initialize client */
export const initialize = (): ThunkAction<void, IAppState, void> => {
  return (dispatch, getState) => {
    dispatch(
      server_initClient({
        name: getLocalUsername(getState()),
        version
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

  return true
}

const initClient = (info: ClientInfo): RpcThunk<void> => (dispatch, getState, { client }) => {
  const id = client.id.toString()

  // TODO: send disconnect reason to client
  if (!validateClientInfo(info, id, getState())) {
    client.close()
    return
  }

  dispatch(
    addUser({
      conn: client,
      name: info.name
    })
  )

  dispatch(multi_userJoined(id.toString()))
  dispatch(syncServerTime())
}
const server_initClient = rpc(RpcRealm.Server, initClient)
