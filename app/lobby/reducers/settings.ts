import { Reducer } from 'redux';
import { isType } from 'utils/redux';
import { setVolume } from 'lobby/actions/settings';

export interface ISettingsState {
  volume: number;
}

const initialState: ISettingsState = {
  volume: 1
};

export const settings: Reducer<ISettingsState> = (
  state: ISettingsState = initialState,
  action: any
) => {
  if (isType(action, setVolume)) {
    return {
      ...state,
      volume: action.payload
    };
  }

  return state;
};
