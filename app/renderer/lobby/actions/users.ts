import { actionCreator } from 'utils/redux'
import { RpcThunk } from 'renderer/lobby/types'
import { getUserName, isAdmin, getUser } from 'renderer/lobby/reducers/users.helpers'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { IMessage } from 'renderer/lobby/reducers/chat'
import { CHAT_MAX_MESSAGE_LENGTH } from 'constants/chat'
import { localUserId } from '../../network'
import { addChat } from './chat'
import { NetworkDisconnectReason } from '../../../constants/network';
import { setDisconnectReason } from './session';

const userJoined = (userId: string): RpcThunk<void> => (dispatch, getState, context) => {
  if (localUserId() === userId) {
    return
  }

  const username = getUserName(getState(), userId)
  const content = `${username} has joined`
  dispatch(addChat({ content, timestamp: Date.now() }))
}
export const multi_userJoined = rpc(RpcRealm.Multicast, userJoined)

const userLeft = (userId: string): RpcThunk<void> => (dispatch, getState, context) => {
  const username = getUserName(getState(), userId)
  const content = `${username} has left`
  dispatch(addChat({ content, timestamp: Date.now() }))
}
export const multi_userLeft = rpc(RpcRealm.Multicast, userLeft)

const kickClient = (reason: NetworkDisconnectReason): RpcThunk<void> => (dispatch, getState) => {
  console.debug(`Received kick with reason: '${reason}'`)
  dispatch(setDisconnectReason(reason))
}
export const client_kick = rpc(RpcRealm.Client, kickClient)

const kickUser = (targetId: string): RpcThunk<void> => (dispatch, getState, context) => {
  // TODO: move to reuseable validation function
  // maybe `dispatch(validateAdmin(state, context))`
  const state = getState()
  const requesterId = context.client.id.toString()

  if (requesterId === targetId) return
  if (!isAdmin(state, requesterId)) return

  const target = getUser(state, targetId)
  if (target) {
    dispatch(client_kick(NetworkDisconnectReason.Kicked)(targetId))

    const conn = context.server.getClientById(targetId)
    if (conn) {
      conn.close()
    }
  }
}
export const server_kickUser = rpc(RpcRealm.Server, kickUser)
