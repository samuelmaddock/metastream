import { IAppState } from 'reducers'
import { addUser } from 'lobby/middleware/users'
import { RpcThunk } from 'lobby/types'
import { multi_userJoined, client_kick } from 'lobby/actions/users'
import { rpc, RpcRealm } from 'network/middleware/rpc'
import {
  getUser,
  getNumUsers,
  isAdmin,
  findUserByName,
  getUniqueName
} from 'lobby/reducers/users.helpers'
import {
  getLocalUsername,
  getLocalColor,
  getLocalSessionMode,
  SessionMode,
  getLocalAvatar
} from 'reducers/settings'
import { USERNAME_MAX_LEN, COLOR_LEN } from 'constants/settings'
import { getMaxUsers, ConnectionStatus } from '../reducers/session'
import { NetworkDisconnectReason, METASTREAM_NETWORK_VERSION } from 'constants/network'
import { setAuthorized, setConnectionStatus, setDisconnectReason } from './session'
import { updateServerClockSkew } from './mediaPlayer'
import { NetConnection, NetServer } from '../../network'
import { addChat } from './chat'
import { actionCreator } from 'utils/redux'
import { AppThunkAction } from 'types/redux-thunk'
import { parseQuery } from 'utils/url'
import { translateEscaped } from 'locale'
import {
  validateDisplayName,
  validateColor,
  validateAvatar,
  getValidAvatar
} from './user-validation'

export type ClientProfile = {
  name: string
  color: string
  avatar?: string
}

type ClientInitRequest = ClientProfile & {
  version: number
  secret?: string
}

const enum ClientInitResponse {
  Ok,
  Pending
}

type AuthorizeInfo = {
  serverTime: number
}

export const clearPendingUser = actionCreator<string>('CLEAR_PENDING_USER')

/** Initialize client */
export const initialize = (server: NetServer): AppThunkAction => {
  return async (dispatch, getState) => {
    const state = getState()
    let response

    const { location } = state.router
    const secret = location ? parseQuery(location.search).secret : undefined

    try {
      response = await dispatch(
        server_initClient({
          version: METASTREAM_NETWORK_VERSION,
          name: getLocalUsername(state),
          color: getLocalColor(state),
          avatar: getLocalAvatar(state),
          secret
        })
      )
    } catch (e) {
      console.error('Failed to receive client initialization response.')
      dispatch(setDisconnectReason(NetworkDisconnectReason.Error))
      server.close()
      return
    }

    if (response === ClientInitResponse.Pending) {
      dispatch(setConnectionStatus(ConnectionStatus.Pending))
    }
  }
}

const validateClientInfo = (
  info: ClientInitRequest,
  id: string,
  state: IAppState
): NetworkDisconnectReason | true => {
  if (info.version !== METASTREAM_NETWORK_VERSION) {
    console.debug(`Client '${info.version}'[${id}] kicked for version mismatch (${info.version})`)
    return NetworkDisconnectReason.VersionMismatch
  }

  const existingUser = !!getUser(state, id)

  if (existingUser) {
    console.debug(`Client with existing ID already active in session ${id}`)
    return NetworkDisconnectReason.InvalidClientInfo
  }

  if (!validateDisplayName(info.name)) {
    console.debug(`Client ${id} kicked for name overflow (${info.name})`)
    return NetworkDisconnectReason.InvalidClientInfo
  }

  if (!validateColor(info.color)) {
    console.debug(`Client ${id} kicked for invalid color (${info.color})`)
    return NetworkDisconnectReason.InvalidClientInfo
  }

  if (info.avatar && !validateAvatar(info.avatar)) {
    console.debug(`Client ${id} kicked for invalid avatar (${info.avatar})`)
    return NetworkDisconnectReason.InvalidClientInfo
  }

  if (info.secret && typeof info.secret !== 'string') {
    console.debug(`Client ${id} kicked for invalid secret (${info.secret})`)
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
const client_authorized = rpc('clientAuthorized', RpcRealm.Client, clientAuthorized)

const initClient = (info: ClientInitRequest): RpcThunk<ClientInitResponse | void> => (
  dispatch,
  getState,
  { client }
) => {
  const state = getState()
  const id = client.id.toString()

  console.debug(`Received client info for ${id}`, info)

  let reason
  let validOrReason

  try {
    validOrReason = validateClientInfo(info, id, state)
  } catch {
    validOrReason = NetworkDisconnectReason.InvalidClientInfo
  }

  if (validOrReason !== true) {
    reason = validOrReason as NetworkDisconnectReason
  } else if (getNumUsers(state) >= getMaxUsers(state)) {
    reason = NetworkDisconnectReason.Full
  }

  if (reason) {
    dispatch(client_kick(reason)(id))
    client.close()
    return
  }

  const sessionMode = getLocalSessionMode(state)

  // Discord invites send session secret
  const secretMismatch = info.secret !== state.session.secret

  // Determine whether user needs explicit authorization from host to join
  const shouldAwaitAuthorization = sessionMode === SessionMode.Private ? secretMismatch : false

  const name = getUniqueName(state, info.name)
  const avatar = getValidAvatar(info.avatar)

  dispatch(
    addUser({
      conn: client,
      name,
      avatar,
      color: info.color,
      pending: shouldAwaitAuthorization
    })
  )

  if (shouldAwaitAuthorization) {
    const content = translateEscaped('noticeUserRequestJoin', { userId: id, username: name })
    dispatch(addChat({ content, html: true, timestamp: Date.now() }))
    return ClientInitResponse.Pending
  }

  dispatch(authorizeClient(client))
  return ClientInitResponse.Ok
}
const server_initClient = rpc('initClient', RpcRealm.Server, initClient, {
  allowUnauthed: true
})

const authorizeClient = (client: NetConnection): AppThunkAction => {
  return async (dispatch, getState) => {
    const id = client.id.toString()
    dispatch(multi_userJoined(id))

    // Client has been fully authorized
    client.auth()

    dispatch(client_authorized({ serverTime: Date.now() })(id))
  }
}

const answerClient = (userId: string, allow: boolean): RpcThunk<void> => (
  dispatch,
  getState,
  { client, server }
) => {
  const state = getState()
  if (!isAdmin(state, client.id.toString())) return

  const user = getUser(state, userId)
  if (!user || !user.pending) return

  const userClient = server.getClientById(userId)
  if (!userClient) return

  if (allow) {
    dispatch(clearPendingUser(userId))
    dispatch(authorizeClient(userClient))
  } else {
    userClient.close()
  }
}
export const server_answerClient = rpc('answerClient', RpcRealm.Server, answerClient)
