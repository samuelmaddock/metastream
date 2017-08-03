import { Reducer } from "redux";
import { NetworkState } from "types/network";
import { isType } from "utils/redux";

export interface IChatState {
  entries: any[];
}

const initial: IChatState = {
  entries: []
};

export const chat: Reducer<IChatState> = (state: IChatState, action: any) => {
  return initial;
};
