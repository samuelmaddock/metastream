import { actionCreator } from 'utils/redux';

export const setVolume = actionCreator<number>('SET_VOLUME');
export const setMute = actionCreator<boolean>('SET_MUTE');
