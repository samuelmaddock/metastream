import { ThunkAction } from 'redux-thunk'
import { IAppState } from 'renderer/reducers'
import { PlatformService } from 'renderer/platform'
import { addUser } from 'renderer/lobby/middleware/users'
import { localUser } from 'renderer/network'
import { RpcThunk } from 'renderer/lobby/types'
import { multi_userJoined } from 'renderer/lobby/actions/users'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { getUser } from 'renderer/lobby/reducers/users'

const { version } = require('package.json')

type ClientInfo = {
  name: string
  version: string
}

/** Initialize client */
export const initialize = (): ThunkAction<void, IAppState, void> => {
  return (dispatch, getState) => {
    const name = PlatformService.getUserName(localUser().id)

    dispatch(
      server_initClient({
        name,
        version
      })
    )
  }
}

const initClient = (info: ClientInfo): RpcThunk<void> => (dispatch, getState, { client }) => {
  const id = client.id.toString()

  if (version !== info.version) {
    // TODO: send disconnect reason to client
    client.close()
    console.debug(`Client '${info.version}'[${id}] kicked for version mismatch (${info.version})`)
    return
  }

  const existingUser = !!getUser(getState(), id)

  if (existingUser) {
    client.close()
    console.debug(`Client with existing ID already active in session ${id}`)
    return
  }

  dispatch(
    addUser({
      conn: client,
      name: info.name
    })
  )

  dispatch(multi_userJoined(id.toString()))
}
const server_initClient = rpc(RpcRealm.Server, initClient)
