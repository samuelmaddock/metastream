import { combineReducers } from 'redux'
import { connectRouter, RouterState } from 'connected-react-router'
import { merge } from 'lodash-es'

import { settings, ISettingsState } from './settings'
import { ui, IUIState } from './ui'

import { ILobbyNetState, lobbyReducers } from '../lobby/reducers'
import { AnyAction } from 'redux'
import { netApplyFullUpdate, netApplyUpdate } from 'network/middleware/sync'
import { ReplicatedState } from 'network/types'
import { mediaPlayerReplicatedState } from '../lobby/reducers/mediaPlayer'
import { usersReplicatedState } from '../lobby/reducers/users'
import { sessionReplicatedState } from 'lobby/reducers/session'
import { isType } from 'utils/redux'
import { reduceChange } from './deepDiff'
import { History } from 'history'

export interface IAppState extends ILobbyNetState {
  settings: ISettingsState
  ui: IUIState
  router: RouterState
}

export const AppReplicatedState: ReplicatedState<IAppState> = {
  mediaPlayer: mediaPlayerReplicatedState,
  session: sessionReplicatedState,
  users: usersReplicatedState
}

export const createReducer = (history: History) => {
  const rootReducer = combineReducers<IAppState>({
    router: connectRouter(history),
    ...lobbyReducers,
    settings,
    ui
  })

  const reducer = (state: IAppState, action: AnyAction): IAppState => {
    if (isType(action, netApplyFullUpdate)) {
      return merge({}, state, action.payload)
    } else if (isType(action, netApplyUpdate)) {
      const diffs = action.payload
      let newState = state
      for (let i = 0; i < diffs.length; i++) {
        newState = reduceChange(newState, diffs[i])
      }
      return newState
    }

    return rootReducer(state, action)
  }

  return reducer
}
