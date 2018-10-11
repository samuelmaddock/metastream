import { Middleware } from 'redux'
import { isType } from 'utils/redux'
import { isEqual } from 'lodash'

import { NetActions, NetMiddlewareOptions } from '../../network/actions'
import { initHostSession, setSessionData } from '../actions/session'
import { IAppState } from '../../reducers/index'
import { getCurrentMedia } from '../reducers/mediaPlayer.helpers'
import { ISessionState } from '../reducers/session'
import { getNumUsers } from '../reducers/users.helpers'
import { ISettingsState } from '../../reducers/settings'

export interface SessionObserver {
  /** Optional setting to watch for changes. */
  setting?: keyof ISettingsState

  /** Apply update when setting value changes. */
  applySetting?: (value: any) => void

  /** Called when session has updated. */
  onChange(state: ISessionState | null): void
}

export const sessionMiddleware = (observers: SessionObserver[] = []): Middleware<{}, IAppState> => {
  return ({ dispatch, getState }) => {
    let inSession = false

    const init = (options: NetMiddlewareOptions) => {
      inSession = true

      if (options.host) {
        dispatch(initHostSession() as any)
        notifyObservers()
      }
    }

    const close = () => {
      inSession = false
      notifyObservers()
    }

    const notifyObservers = () => {
      const session = inSession ? getState().session : null
      observers.forEach(observer => observer.onChange(session))
    }

    const shouldUpdateSession = (state: IAppState, prevState: IAppState) => {
      let sessionData

      const prevMedia = getCurrentMedia(prevState)
      const media = getCurrentMedia(state)

      // Update session media state
      if (media !== prevMedia || state.mediaPlayer.startTime !== prevState.mediaPlayer.startTime) {
        sessionData = {
          ...(sessionData || {}),
          media: media && {
            url: media.requestUrl,
            title: media.title,
            thumbnail: media.imageUrl
          },
          startTime: state.mediaPlayer.startTime
        }
      }

      // Update user info
      if (state.users !== prevState.users) {
        sessionData = {
          ...(sessionData || {}),
          users: getNumUsers(state)
        }
      }

      if (sessionData) {
        dispatch(setSessionData(sessionData))
        return true
      }

      return false
    }

    const compareState = (state: IAppState, prevState: IAppState) => {
      if (state.settings !== prevState.settings) {
        applySettings(state.settings, prevState.settings)
      }

      const updated = shouldUpdateSession(state, prevState)

      if (!updated && !isEqual(state.session, prevState.session)) {
        notifyObservers()
      }
    }

    /** Apply setting if loaded initial values. */
    let didRehydrate = false

    const applySettings = (state: ISettingsState, prevState: ISettingsState) => {
      observers.forEach(observer => {
        const { setting, applySetting } = observer
        if (!setting || !applySetting) return

        const value = state[setting]
        const prevValue = prevState[setting]

        if (value !== prevValue || didRehydrate) {
          applySetting(value)
        }
      })

      // Notify with initial empty state
      if (didRehydrate) {
        notifyObservers()
      }
    }

    return next => action => {
      if (isType(action, NetActions.connect)) {
        init(action.payload)
      } else if (isType(action, NetActions.disconnect)) {
        close()
      }

      const prevState = getState()
      const result = next(action)
      const state = getState()
      didRehydrate = action.type === 'persist/REHYDRATE'

      compareState(state, prevState)

      return result
    }
  }
}
