import { actionCreator } from 'utils/redux'
import { RpcThunk } from 'lobby/types'
import { getUserName } from 'lobby/reducers/users.helpers'
import { rpc, RpcRealm } from 'network/middleware/rpc'
import { IMessage } from 'lobby/reducers/chat'
import { CHAT_MAX_MESSAGE_LENGTH } from 'constants/chat'
import { AppThunkAction } from 'types/redux-thunk'
import { t } from 'locale'

/** Message prior to being processed by reducer. */
type RawMessage = Pick<IMessage, Exclude<keyof IMessage, 'id'>>
export const addChat = actionCreator<RawMessage>('ADD_CHAT')

const broadcastChat = (text: string, userId: string | null): RpcThunk<void> => (
  dispatch,
  getState
) => {
  dispatch(
    addChat({
      author: userId
        ? {
            id: userId,
            username: getUserName(getState(), userId)
          }
        : undefined,
      content: text,
      timestamp: Date.now()
    })
  )
}
export const multi_broadcastChat = rpc('broadcastChat', RpcRealm.Multicast, broadcastChat)

const rpcAddChat = (text: string): RpcThunk<boolean> => (dispatch, getState, context) => {
  text = text.trim()
  if (text.length === 0) return false

  if (text.length > CHAT_MAX_MESSAGE_LENGTH) {
    text = text.substr(0, CHAT_MAX_MESSAGE_LENGTH)
  }

  const userId = context.client.id.toString()
  dispatch(multi_broadcastChat(text, userId))
  return true
}
const server_addChat = rpc('rpcAddChat', RpcRealm.Server, rpcAddChat)

export const sendChat = (text: string): AppThunkAction => {
  return async (dispatch, getState) => {
    try {
      await dispatch(server_addChat(text))
    } catch {
      const content = t('chatMessageFailed')
      dispatch(addChat({ content, timestamp: Date.now() }))
    }
  }
}
