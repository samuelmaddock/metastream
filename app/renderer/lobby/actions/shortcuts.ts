const { ipcRenderer } = chrome;
import { Dispatch } from 'react-redux';
import { ThunkAction } from 'redux-thunk';
import { IAppState } from 'renderer/reducers';

import { server_requestNextMedia, server_requestPlayPause } from 'renderer/lobby/actions/mediaPlayer';

let unregister: Function | undefined;

const dispatchCommand = (
  cmd: string,
  dispatch: Dispatch<IAppState>,
  getState: () => IAppState
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

export const registerMediaShortcuts = (): ThunkAction<void, IAppState, void> => {
  return (dispatch, getState, extra) => {
    const onCommand = (sender: Electron.WebContents, cmd: string) =>
      dispatch(dispatchCommand.bind(null, cmd));

    ipcRenderer.on('command', onCommand);

    unregister = () => {
      ipcRenderer.removeListener('command', onCommand);
    };
  };
};

export const unregisterMediaShortcuts = (): ThunkAction<void, IAppState, void> => {
  return (dispatch, getState) => {
    if (unregister) {
      unregister();
      unregister = undefined;
    }
  };
};
