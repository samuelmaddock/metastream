import { actionCreator } from 'utils/redux'
import { RpcThunk } from 'renderer/lobby/types'
import { getUserName } from 'renderer/lobby/reducers/users'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { IMessage } from 'renderer/lobby/reducers/chat'
import { CHAT_MAX_MESSAGE_LENGTH } from 'constants/chat'
import { localUserId } from '../../network'
import { addChat } from './chat'

const userJoined = (userId: string): RpcThunk<void> => (dispatch, getState, context) => {
  if (localUserId() === userId) {
    return
  }

  const username = getUserName(getState(), userId)
  const msg = `${username} has joined`
  dispatch(
    addChat({
      content: username,
      timestamp: Date.now()
    })
  )
}
export const multi_userJoined = rpc(RpcRealm.Multicast, userJoined)

const userLeft = (userId: string): RpcThunk<void> => (dispatch, getState, context) => {
  const username = getUserName(getState(), userId)
  const msg = `${username} has left`
  dispatch(
    addChat({
      content: username,
      timestamp: Date.now()
    })
  )
}
export const multi_userLeft = rpc(RpcRealm.Multicast, userLeft)
