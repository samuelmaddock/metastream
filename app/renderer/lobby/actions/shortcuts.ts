const { ipcRenderer } = chrome;
import { Dispatch } from 'react-redux';
import { ThunkAction } from 'redux-thunk';

import { ILobbyNetState } from 'renderer/lobby';
import { server_requestNextMedia, server_requestPlayPause } from 'renderer/lobby/actions/mediaPlayer';

let unregister: Function | undefined;

const dispatchCommand = (
  cmd: string,
  dispatch: Dispatch<ILobbyNetState>,
  getState: () => ILobbyNetState
) => {
  switch (cmd) {
    case 'media:next':
      dispatch(server_requestNextMedia());
      break;
    case 'media:playpause':
      dispatch(server_requestPlayPause());
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
