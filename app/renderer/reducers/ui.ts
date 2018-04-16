import { Reducer } from 'redux';
import { isType } from 'utils/redux';
import { IAppState } from 'renderer/reducers';
import { setUpdateState } from 'renderer/actions/ui';

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

export const isUpdateAvailable = (state: IAppState): boolean => {
  return !!state.ui.updateAvailable
};
