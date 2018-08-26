const { ipcRenderer } = chrome
import { ThunkAction } from 'redux-thunk'

import { actionCreator } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { LobbyModal } from '../reducers/ui'

export const setUpdateState = actionCreator<boolean>('SET_UPDATE_STATE')
export const setLobbyModal = actionCreator<LobbyModal | undefined>('SET_LOBBY_MODAL')

export const listenForUiEvents = (): ThunkAction<void, IAppState, void> => {
  return dispatch => {
    ipcRenderer.on('update:ready', () => {
      console.log('Update is available')
      dispatch(setUpdateState(true))
    })
  }
}

export const installUpdate = (): ThunkAction<void, IAppState, void> => {
  return () => {
    ipcRenderer.send('install-update')
  }
}
