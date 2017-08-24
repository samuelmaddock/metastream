import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { lobby, ILobbyState } from "reducers/lobby";
import { Reducer } from "redux";

import { chat, IChatState } from "./chat";
import { AnyAction } from "redux";

export interface ILobbyNetState {
  chat: IChatState;
}

const rootReducer = combineReducers<ILobbyNetState>({
  chat
});

export default rootReducer;
