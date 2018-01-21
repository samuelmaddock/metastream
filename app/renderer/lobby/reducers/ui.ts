import { Reducer } from 'redux';
import { isType } from 'utils/redux';
import { ILobbyNetState } from './';
import { setSessionData } from 'renderer/lobby/middleware/session';
import { setUpdateState } from 'renderer/lobby/actions/ui';

export interface IUIState {
  updateAvailable?: boolean;
}

const initialState: IUIState = {};

export const ui: Reducer<IUIState> = (
  state: IUIState = initialState,
  action: any
) => {
  if (isType(action, setUpdateState)) {
    return {...state, updateAvailable: action.payload};
  }

  return state;
};

export const isUpdateAvailable = (state: ILobbyNetState): boolean => {
  return !!state.ui.updateAvailable
};
