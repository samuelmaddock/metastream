import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { lobby, ILobbyState } from "reducers/lobby";
import { Reducer } from "redux";

import { chat, IChatState } from "./chat";
import { commit, CommitState } from "lobby/net/reducers/commit";
import { AnyAction } from "redux";

export interface ILobbyNetState {
  chat: IChatState;
  commit: CommitState;
}

const rootReducer = combineReducers<ILobbyNetState>({
  chat,
  commit
});

export default rootReducer;
