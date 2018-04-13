import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { clamp } from 'utils/math'
import { setVolume, setMute, setUsername, setColor } from 'renderer/actions/settings'
import { USERNAME_MAX_LEN, COLOR_LEN, DEFAULT_COLOR, DEFAULT_USERNAME } from 'constants/settings'
import { IAppState } from './index';

export interface ISettingsState {
  mute: boolean
  volume: number
  username?: string,
  color?: string
}

const initialState: ISettingsState = {
  mute: false,
  volume: 0.75
}

export const settings: Reducer<ISettingsState> = (
  state: ISettingsState = initialState,
  action: any
) => {
  if (isType(action, setVolume)) {
    return {
      ...state,
      mute: false,
      volume: clamp(action.payload, 0, 1)
    }
  } else if (isType(action, setMute)) {
    return {
      ...state,
      mute: action.payload
    }
  }

  if (isType(action, setUsername)) {
    const username = action.payload && action.payload.trim().substr(0, USERNAME_MAX_LEN)
    return { ...state, username }
  }

  if (isType(action, setColor)) {
    const color = action.payload.substr(0, COLOR_LEN)
    return { ...state, color }
  }

  return state
}

export const getLocalUsername = (state: IAppState) => state.settings.username || DEFAULT_USERNAME
export const getLocalColor = (state: IAppState) => state.settings.color || DEFAULT_COLOR
