import { ILobbyNetState } from 'lobby/reducers';

export const getCurrentMedia = (state: ILobbyNetState) => {
  return state.mediaPlayer.current;
};

export const getPlaybackState = (state: ILobbyNetState) => {
  return state.mediaPlayer.playback;
};
