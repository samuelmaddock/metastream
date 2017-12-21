import { Reducer } from 'redux';
import { NetworkState } from 'types/network';
import { isType } from 'utils/redux';

import { loadLobbies, setLobbies } from 'actions/lobby';
import { ILobbySession } from 'platform/types';

export interface ILobbyState {
  network: NetworkState;
  list?: ILobbySession[];
}

const initial: ILobbyState = {
  network: NetworkState.Uninitialized
};

export const lobby: Reducer<ILobbyState> = (state: ILobbyState, action: any) => {
  if (isType(action, loadLobbies)) {
    return {
      ...state,
      network: NetworkState.Loading,
      list: undefined
    };
  } else if (isType(action, setLobbies)) {
    return {
      ...state,
      network: NetworkState.Ready,
      list: action.payload
    };
  }

  return initial;
};
