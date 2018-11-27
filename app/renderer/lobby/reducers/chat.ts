import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { addChat } from 'renderer/lobby/actions/chat'
import { resetLobby } from '../actions/common'

export interface IMessageAuthor {
  id: string
  avatar?: string
  username: string
}

export interface IMessage {
  // id: string;

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
      messages: [...state.messages, action.payload]
    }
  }

  if (isType(action, resetLobby)) {
    return initialState
  }

  return state
}
