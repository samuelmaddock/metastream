import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { setUpdateState, setLobbyModal } from 'renderer/actions/ui'

export const enum LobbyModal {
  Browser = 'browser',
  Invite = 'invite',
  MediaInfo = 'media-info',
  Purchase = 'purchase',
  SessionSettings = 'session-settings'
}

export interface IUIState {
  updateAvailable?: boolean
  lobbyModal?: LobbyModal
}

const initialState: IUIState = {}

export const ui: Reducer<IUIState> = (state: IUIState = initialState, action: any) => {
  if (isType(action, setUpdateState)) {
    return { ...state, updateAvailable: action.payload }
  }

  if (isType(action, setLobbyModal)) {
    return { ...state, lobbyModal: action.payload }
  }

  return state
}

export const isUpdateAvailable = (state: IAppState): boolean => {
  return !!state.ui.updateAvailable
}
