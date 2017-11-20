import { ipcRenderer } from 'electron';

import { ThunkAction } from 'redux-thunk';
import { ILobbyNetState } from 'lobby';

import { playPauseMedia, nextMedia } from 'lobby/actions/mediaPlayer';
import { getPlaybackTime } from 'lobby/reducers/mediaPlayer.helpers';

type Thunk = ThunkAction<void, ILobbyNetState, void>;

let unregister: Function | undefined;

const onNextTrack: Thunk = dispatch => {
  dispatch(nextMedia());
};

const onPlayPause: Thunk = (dispatch, getState) => {
  const curTime = getPlaybackTime(getState());
  dispatch(playPauseMedia(curTime));
};

export const registerMediaShortcuts = (): ThunkAction<void, ILobbyNetState, void> => {
  return (dispatch, getState, extra) => {
    const next = () => dispatch(onNextTrack);
    const playPause = () => dispatch(onPlayPause);

    ipcRenderer.on('medianexttrack', next);
    ipcRenderer.on('mediaplaypause', playPause);

    unregister = () => {
      ipcRenderer.removeListener('medianexttrack', next);
      ipcRenderer.removeListener('mediaplaypause', playPause);
    };
  };
};

export const unregisterMediaShortcuts = (): ThunkAction<void, ILobbyNetState, void> => {
  return (dispatch, getState) => {
    if (unregister) {
      unregister();
      unregister = undefined;
    }
  };
};
