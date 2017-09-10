import { Reducer } from "redux";
import { NetworkState } from "types/network";
import { isType } from "utils/redux";
import { addChat } from "lobby/net/actions/chat";

export interface IChatEntry {
  sender: string;
  name: string;
  message: string;
}

export interface IChatState {
  entries: IChatEntry[];
}

const initialState: IChatState = {
  entries: []
};

export const chat: Reducer<IChatState> = (state: IChatState = initialState, action: any) => {
  if (isType(action, addChat)) {
    return {
      ...state,
      entries: [...state.entries, action.payload]
    }
  }

  return state;
};
