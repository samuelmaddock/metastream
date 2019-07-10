import { Reducer, AnyAction } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'reducers'
import { setUpdateState, setLobbyModal, checkExtensionInstall } from 'actions/ui'
import { getIsInstalled } from '../utils/extension'
import { BEFORE_INSTALL_PROMPT, APP_INSTALLED } from '../middleware/pwa'

export const enum LobbyModal {
  Browser = 'browser',
  Invite = 'invite',
  MediaInfo = 'media-info',
  SessionSettings = 'session-settings',
  EndSession = 'end-session'
}

export interface IUIState {
  updateAvailable?: boolean
  lobbyModal?: LobbyModal
  isExtensionInstalled: boolean
  pwaInstallReady?: boolean
}

const initialState: IUIState = {
  isExtensionInstalled: getIsInstalled()
}

export const ui: Reducer<IUIState> = (state: IUIState = initialState, action: AnyAction) => {
  if (isType(action, setUpdateState)) {
    return { ...state, updateAvailable: action.payload }
  } else if (isType(action, setLobbyModal)) {
    return { ...state, lobbyModal: action.payload }
  } else if (isType(action, checkExtensionInstall)) {
    return { ...state, isExtensionInstalled: getIsInstalled() }
  }

  if (action.type === BEFORE_INSTALL_PROMPT) {
    return { ...state, pwaInstallReady: true }
  } else if (action.type === APP_INSTALLED) {
    return { ...state, pwaInstallReady: false }
  }

  return state
}

export const isUpdateAvailable = (state: IAppState): boolean => {
  return !!state.ui.updateAvailable
}
