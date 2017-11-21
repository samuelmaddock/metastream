import { ipcRenderer } from 'electron';
import { Dispatch } from 'react-redux';
import { ThunkAction } from 'redux-thunk';

import { ILobbyNetState } from 'lobby';
import { playPauseMedia, nextMedia } from 'lobby/actions/mediaPlayer';
import { getPlaybackTime } from 'lobby/reducers/mediaPlayer.helpers';

let unregister: Function | undefined;

const dispatchCommand = (
  cmd: string,
  dispatch: Dispatch<ILobbyNetState>,
  getState: () => ILobbyNetState
) => {
  switch (cmd) {
    case 'media:next':
      dispatch(nextMedia());
      break;
    case 'media:playpause':
      const curTime = getPlaybackTime(getState());
      dispatch(playPauseMedia(curTime));
      break;
  }
};

export const registerMediaShortcuts = (): ThunkAction<void, ILobbyNetState, void> => {
  return (dispatch, getState, extra) => {
    const onCommand = (sender: Electron.WebContents, cmd: string) =>
      dispatch(dispatchCommand.bind(null, cmd));

    ipcRenderer.on('command', onCommand);

    unregister = () => {
      ipcRenderer.removeListener('command', onCommand);
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
