const { ipcRenderer } = chrome

import { actionCreator } from 'utils/redux'
import { LobbyModal } from '../reducers/ui'
import { AppThunkAction } from 'types/redux-thunk'

export const setUpdateState = actionCreator<boolean>('SET_UPDATE_STATE')
export const setLobbyModal = actionCreator<LobbyModal | undefined>('SET_LOBBY_MODAL')

export const listenForUiEvents = (): AppThunkAction => {
  return dispatch => {
    ipcRenderer.on('update:ready', () => {
      console.log('Update is available')
      dispatch(setUpdateState(true))
    })
  }
}

export const installUpdate = (): AppThunkAction => {
  return () => {
    ipcRenderer.send('install-update')
  }
}
