import { actionCreator } from 'utils/redux';

export const setVolume = actionCreator<number>('SET_VOLUME');
export const setMute = actionCreator<boolean>('SET_MUTE');

export const setUsername = actionCreator<string | undefined>('SET_USERNAME');
export const setColor = actionCreator<string>('SET_COLOR');
