const { ipcRenderer } = chrome
import { Dispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'

import { actionCreator } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { IPopupState } from '../reducers/extensions'

export const updateExtensions = actionCreator<any[]>('UPDATE_EXTENSIONS')
export const showExtensionPopup = actionCreator<IPopupState | void>('SHOW_EXTENSION_POPUP')

let dispatch: Function

const statusListener = (event: Electron.Event, results: any[]) => {
  dispatch(updateExtensions(results))
}

const popupListener = (event: Electron.Event, extensionId: string, popup: string, props: any) => {
  dispatch(showExtensionPopup({ ...props, src: popup }))
}

export const addExtensionListeners = (): ThunkAction<void, IAppState, void> => {
  return _dispatch => {
    dispatch = _dispatch
    ipcRenderer.on('extensions-status', statusListener)
    ipcRenderer.on('extensions-show-popup', popupListener)
  }
}

export const removeExtensionListeners = (): ThunkAction<void, IAppState, void> => {
  return () => {
    ipcRenderer.removeListener('extensions-status', statusListener)
    ipcRenderer.removeListener('extensions-show-popup', popupListener)
  }
}
