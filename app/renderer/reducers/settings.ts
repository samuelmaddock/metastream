import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { clamp } from 'utils/math'
import { setVolume, setMute, setUsername, setColor, setSetting } from 'renderer/actions/settings'
import {
  USERNAME_MAX_LEN,
  COLOR_LEN,
  DEFAULT_COLOR,
  DEFAULT_USERNAME,
  USERNAME_MIN_LEN
} from 'constants/settings'
import { IAppState } from './index'
import { stripEmoji } from 'utils/string'
import { avatarRegistry } from '../services/avatar'

export const enum SessionMode {
  Public,
  Private,
  Request
}

export interface ISettingsState {
  mute: boolean
  volume: number
  username?: string
  color?: string
  allowTracking: boolean
  developer: boolean
  sessionMode: SessionMode
  discordPresence: boolean
  avatar?: string
}

const initialState: ISettingsState = {
  mute: false,
  volume: 0.75,
  allowTracking: false,
  developer: process.env.NODE_ENV === 'development',
  sessionMode: SessionMode.Request,
  discordPresence: true
}

export const settings: Reducer<ISettingsState> = (
  state: ISettingsState = initialState,
  action: any
) => {
  if (isType(action, setSetting as any)) {
    const { key, value } = action.payload as any
    return { ...state, [key]: value }
  }

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
    let username = action.payload && stripEmoji(action.payload.trim()).substr(0, USERNAME_MAX_LEN)

    if (typeof username === 'undefined' || username.length >= USERNAME_MIN_LEN) {
      return { ...state, username }
    }
  } else if (isType(action, setColor)) {
    const color = action.payload.substr(0, COLOR_LEN)
    return { ...state, color }
  }

  return state
}

export const getLocalUsername = (state: IAppState) => state.settings.username || DEFAULT_USERNAME
export const getLocalColor = (state: IAppState) => state.settings.color || DEFAULT_COLOR
export const getLocalSessionMode = (state: IAppState) => state.settings.sessionMode || DEFAULT_COLOR
export const isDeveloper = (state: IAppState) => state.settings.developer
export const getLocalAvatar = (state: IAppState) => {
  let src
  if (state.settings.avatar) {
    try {
      src = avatarRegistry.resolve(state.settings.avatar)
    } catch {}
  }
  return src
}
