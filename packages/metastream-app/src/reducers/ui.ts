import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'reducers'
import { setUpdateState, setLobbyModal, checkExtensionInstall } from 'actions/ui'
import { getIsInstalled } from '../utils/extension'

export const enum LobbyModal {
  Browser = 'browser',
  Invite = 'invite',
  MediaInfo = 'media-info',
  SessionSettings = 'session-settings'
}

export interface IUIState {
  updateAvailable?: boolean
  lobbyModal?: LobbyModal
  isExtensionInstalled: boolean
}

const initialState: IUIState = {
  isExtensionInstalled: getIsInstalled()
}

export const ui: Reducer<IUIState> = (state: IUIState = initialState, action: any) => {
  if (isType(action, setUpdateState)) {
    return { ...state, updateAvailable: action.payload }
  } else if (isType(action, setLobbyModal)) {
    return { ...state, lobbyModal: action.payload }
  } else if (isType(action, checkExtensionInstall)) {
    return { ...state, isExtensionInstalled: getIsInstalled() }
  }

  return state
}

export const isUpdateAvailable = (state: IAppState): boolean => {
  return !!state.ui.updateAvailable
}
