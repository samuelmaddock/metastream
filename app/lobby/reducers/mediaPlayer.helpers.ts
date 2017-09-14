import { ILobbyNetState } from 'lobby/reducers';
import { PlaybackState } from 'lobby/reducers/mediaPlayer';

export const getCurrentMedia = (state: ILobbyNetState) => {
  return state.mediaPlayer.current;
};

export const getPlaybackState = (state: ILobbyNetState) => {
  return state.mediaPlayer.playback;
};

export const getPlaybackTime = (state: ILobbyNetState) => {
  const current = getCurrentMedia(state);
  const playback = getPlaybackState(state);
  const startTime = state.mediaPlayer.startTime;

  switch (playback) {
    case PlaybackState.Playing:
      const curTime = Date.now() - startTime!;
      return curTime;
    case PlaybackState.Paused:
      return state.mediaPlayer.pauseTime;
  }

  return -1;
};
