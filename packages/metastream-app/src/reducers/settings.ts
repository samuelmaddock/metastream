import { Reducer } from 'redux'
import { createStructuredSelector } from 'reselect'
import { isType } from 'utils/redux'
import { clamp } from 'utils/math'
import { setVolume, setMute, setUsername, setColor, setSetting } from 'actions/settings'
import {
  USERNAME_MAX_LEN,
  COLOR_LEN,
  DEFAULT_COLOR,
  DEFAULT_USERNAME,
  USERNAME_MIN_LEN
} from 'constants/settings'
import { IAppState } from '.'
import { stripEmoji } from 'utils/string'
import { avatarRegistry } from '../services/avatar'
import { DEFAULT_LANGUAGE } from 'locale'
import { ChatLocation } from '../components/chat/Location'

export const enum SessionMode {
  /** Open to connections. */
  Public = 0,

  /** Not listening for connections. */
  Offline = 1,

  /** Permission to join is requested upon connection. */
  Private = 2
}

export interface ISettingsState {
  mute: boolean
  volume: number
  username?: string
  color?: string
  allowTracking: boolean
  sessionMode: SessionMode
  maxUsers?: number
  avatar?: string
  language: string
  chatLocation: ChatLocation
  autoFullscreen: boolean
  theaterMode: boolean
}

const initialState: ISettingsState = {
  mute: false,
  volume: 0.75,
  allowTracking: false,
  sessionMode: SessionMode.Private,
  language: DEFAULT_LANGUAGE,
  chatLocation: ChatLocation.FloatLeft,
  autoFullscreen: true,
  theaterMode: false
}

export const settings: Reducer<ISettingsState> = (
  state: ISettingsState = initialState,
  action: any
) => {
  if (isType(action, setSetting as any)) {
    const { key, value } = action.payload as { key: keyof ISettingsState; value: any }
    const currentValue = state[key]
    const newValue = typeof value === 'function' ? value(currentValue) : value
    return { ...state, [key]: newValue }
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

export const getLocalAvatar = (state: IAppState) => {
  const { avatar } = state.settings
  if (avatar) {
    return avatar
  }
}

export const resolveLocalAvatar = (state: IAppState) => {
  const avatar = getLocalAvatar(state)
  let src
  if (avatar) {
    try {
      src = avatarRegistry.resolve(avatar)
    } catch {}
  }
  return src
}

export interface PlayerSettings {
  autoFullscreen: boolean
  theaterMode: boolean
}

/** Gets a subset of settings to pass to player extension */
export const getPlayerSettings = createStructuredSelector<IAppState, PlayerSettings>({
  autoFullscreen: state => state.settings.autoFullscreen,
  theaterMode: state => state.settings.theaterMode
})
