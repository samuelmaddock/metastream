import { combineReducers } from 'redux'
import { routerReducer as router, RouterState } from 'react-router-redux'
import { Reducer } from 'redux'

import { extensions, IExtensionsState } from './extensions'
import { lobby, ILobbyState } from './lobby'
import { settings, ISettingsState } from './settings'
import { ui, IUIState } from './ui'

import { ILobbyNetState, lobbyReducers } from '../lobby/reducers'
import { AnyAction } from 'redux'
import { NetReduxActionTypes } from 'renderer/network/middleware/sync'
import { ReplicatedState } from 'renderer/network/types'
import { mediaPlayerReplicatedState } from '../lobby/reducers/mediaPlayer'

export interface IAppState extends ILobbyNetState {
  extensions: IExtensionsState
  lobby: ILobbyState
  settings: ISettingsState
  ui: IUIState
  router: RouterState
}

export const AppReplicatedState: ReplicatedState<IAppState> = {
  mediaPlayer: mediaPlayerReplicatedState,
  session: true,
  users: true
}

const rootReducer = combineReducers<IAppState>({
  router: router as Reducer<any>,
  extensions,
  lobby, // TODO: rename to 'servers'?
  ...lobbyReducers,
  settings,
  ui
})

const reducer = (state: IAppState, action: AnyAction): IAppState => {
  // HACK: force re-render on network update
  if (action.type === NetReduxActionTypes.UPDATE) {
    return { ...state }
  }
  return rootReducer(state, action)
}

export default reducer
