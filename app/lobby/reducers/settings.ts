import { Reducer } from 'redux';
import { isType } from 'utils/redux';
import { setVolume, setMute } from 'lobby/actions/settings';
import { clamp } from 'utils/math';

export interface ISettingsState {
  mute: boolean;
  volume: number;
}

const initialState: ISettingsState = {
  mute: false,
  volume: 0.75
};

export const settings: Reducer<ISettingsState> = (
  state: ISettingsState = initialState,
  action: any
) => {
  if (isType(action, setVolume)) {
    return {
      ...state,
      mute: false,
      volume: clamp(action.payload, 0, 1)
    };
  } else if (isType(action, setMute)) {
    return {
      ...state,
      mute: action.payload
    };
  }

  return state;
};
