const { ipcRenderer } = chrome

import { actionCreator } from 'utils/redux'
import { IPopupState } from '../reducers/extensions'
import { AppThunkAction } from 'types/redux-thunk'

type StatusResults = {
  rootDir: string
  list: any[]
}

export const updateExtensions = actionCreator<StatusResults>('UPDATE_EXTENSIONS')
export const showExtensionPopup = actionCreator<IPopupState | void>('SHOW_EXTENSION_POPUP')

let dispatch: Function

const statusListener = (event: Electron.Event, results: StatusResults) => {
  dispatch(updateExtensions(results))
}

const popupListener = (event: Electron.Event, extensionId: string, popup: string, props: any) => {
  dispatch(showExtensionPopup({ ...props, src: popup }))
}

export const addExtensionListeners = (): AppThunkAction => {
  return _dispatch => {
    dispatch = _dispatch
    ipcRenderer.on('extensions-status', statusListener)
    ipcRenderer.on('extensions-show-popup', popupListener)
  }
}

export const removeExtensionListeners = (): AppThunkAction => {
  return () => {
    ipcRenderer.removeListener('extensions-status', statusListener)
    ipcRenderer.removeListener('extensions-show-popup', popupListener)
  }
}
