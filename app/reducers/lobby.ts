import { Reducer } from "redux";
import { NetworkState } from "types/network";
import { isType } from "utils/redux";

import { loadLobbies, setLobbies, ILobbyRequestResult, IChatMessage, addChat } from "actions/steamworks";

export interface ILobbyState {
  network: NetworkState;
  list?: ILobbyRequestResult[];
  chat?: IChatMessage[];
}

const initial: ILobbyState = {
  network: NetworkState.Uninitialized
};

export const lobby: Reducer<ILobbyState> = (state: ILobbyState, action: any) => {
  if (isType(action, loadLobbies)) {
    return {...state,
      network: NetworkState.Loading,
      list: undefined
    };
  } else if (isType(action, setLobbies)) {
    return {...state,
      network: NetworkState.Ready,
      list: action.payload
    };
  }

  if (isType(action, addChat)) {
    const chat = [...state.chat || [], action.payload];
    return { ...state, chat };
  }

  return initial;
};
