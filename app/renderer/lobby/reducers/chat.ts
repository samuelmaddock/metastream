import { Reducer } from 'redux';
import { NetworkState } from 'types/network';
import { isType } from 'utils/redux';
import { addChat } from 'lobby/actions/chat';

export interface IMessageAuthor {
  id: string;
  avatar?: string;
  username: string;
}

export interface IMessage {
  // id: string;

  author: IMessageAuthor;

  /** Raw markdown content. */
  content: string;

  /** Unix timestamp */
  timestamp: number;
}

export interface IChatState {
  messages: IMessage[];
}

const initialState: IChatState = {
  messages: []
};

export const chat: Reducer<IChatState> = (state: IChatState = initialState, action: any) => {
  if (isType(action, addChat)) {
    return {
      ...state,
      messages: [...state.messages, action.payload]
    };
  }

  return state;
};
