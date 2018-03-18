const { ipcRenderer } = chrome
import { Dispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'

import { actionCreator } from 'utils/redux'
import { IAppState } from 'renderer/reducers'

export const updateExtensions = actionCreator<any[]>('UPDATE_EXTENSIONS')

let statusListener: Function

export const addExtensionListeners = (): ThunkAction<void, IAppState, void> => {
  return dispatch => {
    statusListener = (event: Electron.Event, results: any[]) => {
      console.log('EXTENSION UPDATE', results)
      dispatch(updateExtensions(results))
    }
    ipcRenderer.on('extensions-status', statusListener)
  }
}

export const removeExtensionListeners = (): ThunkAction<void, IAppState, void> => {
  return dispatch => {
    ipcRenderer.removeListener('extensions-status', statusListener)
  }
}
