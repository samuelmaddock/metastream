import { actionCreator } from 'utils/redux'
import { ISettingsState } from '../reducers/settings'

export const setVolume = actionCreator<number>('SET_VOLUME')
export const addVolume = actionCreator<number>('ADD_VOLUME')
export const setMute = actionCreator<boolean>('SET_MUTE')

type SettingValueCallback<T> = (value: T) => T

const SET_SETTING = 'SET_SETTING'
export const setSetting = <T extends keyof ISettingsState>(
  key: T,
  value: ISettingsState[T] | SettingValueCallback<ISettingsState[T]>
) => {
  return { type: SET_SETTING, payload: { key, value } }
}
;(setSetting as any).type = SET_SETTING

export const setUsername = actionCreator<string | undefined>('SET_USERNAME')
export const setColor = actionCreator<string>('SET_COLOR')
