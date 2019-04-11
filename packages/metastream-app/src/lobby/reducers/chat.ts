import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { addChat } from 'lobby/actions/chat'
import { resetLobby } from '../actions/common'

let CHAT_MESSAGE_COUNTER = 0

export interface IMessageAuthor {
  id: string
  avatar?: string
  username: string
}

export interface IMessage {
  /** Unique ID of message. */
  id: string

  author?: IMessageAuthor

  /** Raw markdown content. */
  content: string

  /** Whether content contains HTML markup to be parsed. */
  html?: boolean

  /** Unix timestamp */
  timestamp: number
}

export interface IChatState {
  messages: IMessage[]
}

const initialState: IChatState = {
  messages: []
}

export const chat: Reducer<IChatState> = (state: IChatState = initialState, action: any) => {
  if (isType(action, addChat)) {
    return {
      ...state,
      messages: [
        ...state.messages,
        {
          ...action.payload,
          id: `${++CHAT_MESSAGE_COUNTER}`
        }
      ]
    }
  }

  if (isType(action, resetLobby)) {
    return initialState
  }

  return state
}
