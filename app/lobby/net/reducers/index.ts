import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { lobby, ILobbyState } from "reducers/lobby";
import { Reducer } from "redux";

import { chat, IChatState } from "./chat";
import { AnyAction } from "redux";
import { NetReduxActionTypes } from "lobby/net/middleware/sync";

export interface ILobbyNetState {
  chat: IChatState;
}

const rootReducer = combineReducers<ILobbyNetState>({
  chat
});

const reducer = (state: ILobbyNetState, action: AnyAction): ILobbyNetState => {
  // HACK: force re-render on network update
  if (action.type === NetReduxActionTypes.UPDATE) {
    return {...state};
  }
  return rootReducer(state, action);
};

export default reducer;
