const { ipcRenderer } = chrome;
import { Dispatch } from 'react-redux';
import { ThunkAction } from 'redux-thunk';

import { actionCreator } from 'utils/redux';
import { IAppState } from 'renderer/reducers';

export const setUpdateState = actionCreator<boolean>('SET_UPDATE_STATE');

export const listenForUiEvents = (): ThunkAction<void, IAppState, void> => {
  return (dispatch, getState) => {
    ipcRenderer.on('update-ready', () => {
      console.log('Update is available')
      dispatch(setUpdateState(true))
    });
  };
};
