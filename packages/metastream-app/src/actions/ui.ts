import { actionCreator } from 'utils/redux'
import { LobbyModal } from '../reducers/ui'

export const setUpdateState = actionCreator<boolean>('SET_UPDATE_STATE')
export const setLobbyModal = actionCreator<LobbyModal | undefined>('SET_LOBBY_MODAL')
export const checkExtensionInstall = actionCreator<void>('CHECK_EXTENSION_INSTALL')
export const setPopupPlayer = actionCreator<boolean>('SET_POPUP_PLAYER')
