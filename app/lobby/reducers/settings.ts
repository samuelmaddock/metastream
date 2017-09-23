import { Reducer } from 'redux';
import { isType } from 'utils/redux';
import { setVolume, setMute } from 'lobby/actions/settings';

export interface ISettingsState {
  mute: boolean;
  volume: number;
}

const initialState: ISettingsState = {
  mute: false,
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
  } else if (isType(action, setMute)) {
    return {
      ...state,
      mute: action.payload
    };
  }

  return state;
};
