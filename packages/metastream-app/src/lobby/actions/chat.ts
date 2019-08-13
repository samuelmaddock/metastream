import { actionCreator } from 'utils/redux'
import { RpcThunk } from 'lobby/types'
import { getUserName } from 'lobby/reducers/users.helpers'
import { rpc, RpcRealm } from 'network/middleware/rpc'
import { IMessage, Typing } from 'lobby/reducers/chat'
import { CHAT_MAX_MESSAGE_LENGTH } from 'constants/chat'
import { AppThunkAction } from 'types/redux-thunk'
import { t } from 'locale'
import { sendMediaRequest } from './mediaPlayer'
import { isUrl } from 'utils/url'
import { localUserId } from '../../network/index'
import { TYPING_DURATION } from '../reducers/chat.helpers'

/** Message prior to being processed by reducer. */
type RawMessage = Pick<IMessage, Exclude<keyof IMessage, 'id'>>
export const addChat = actionCreator<RawMessage>('ADD_CHAT')

export const recordTyping = actionCreator<string>('RECORD_TYPING')
export const clearTyping = actionCreator<string>('CLEAR_TYPING')

const userTypingTimeouts: { [userId: string]: number | undefined } = {}

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

  // Clear user typing immediately if we received a message from them
  const typingTimeout = userId && userTypingTimeouts[userId]
  if (typingTimeout) {
    clearTimeout(typingTimeout)
    userTypingTimeouts[userId!] = undefined
    dispatch(clearTyping(userId!))
  }
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
    if (isUrl(text)) {
      dispatch(sendMediaRequest(text, 'chat'))
      return
    }

    try {
      await dispatch(server_addChat(text))
    } catch {
      const content = t('chatMessageFailed')
      dispatch(addChat({ content, timestamp: Date.now() }))
    }
  }
}

const broadcastTyping = (userId: string): RpcThunk<void> => dispatch => {
  if (userId === localUserId()) return
  dispatch(recordTyping(userId))

  let timeout = userTypingTimeouts[userId]
  if (timeout) clearTimeout(timeout)
  userTypingTimeouts[userId] = setTimeout(() => {
    dispatch(clearTyping(userId))
  }, TYPING_DURATION) as any
}
const multi_broadcastTyping = rpc('broadcastTyping', RpcRealm.Multicast, broadcastTyping)

const rpcNotifyTyping = (): RpcThunk<void> => (dispatch, getState, context) => {
  const userId = context.client.id.toString()
  dispatch(multi_broadcastTyping(userId))
}
export const server_notifyTyping = rpc('rpcNotifyTyping', RpcRealm.Server, rpcNotifyTyping)
