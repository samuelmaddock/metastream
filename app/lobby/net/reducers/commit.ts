import { Reducer } from "redux";
import { NetworkState } from "types/network";
import { isType } from "utils/redux";
import { addChat } from "lobby/net/actions/chat";
import { NetActionTypes } from "lobby/net/middleware/sync";

export type CommitState = number;

const initialState: CommitState = -1;

export const commit: Reducer<CommitState> = (state: CommitState = initialState, action: any) => {
  if (action.type === NetActionTypes.UPDATE) {
    return action.payload;
  }
  return state;
};
