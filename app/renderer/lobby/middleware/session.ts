import { Middleware } from 'redux'
import { isType } from 'utils/redux'
import { isEqual } from 'lodash'

import { NetActions, NetMiddlewareOptions } from '../../network/actions'
import { initHostSession, setSessionData } from '../actions/session'
import { IAppState } from '../../reducers/index'
import { getCurrentMedia } from '../reducers/mediaPlayer.helpers'
import { ISessionState } from '../reducers/session'
import { getNumUsers } from '../reducers/users.helpers'

export interface SessionObserver {
  onChange(state: ISessionState): void
}

export const sessionMiddleware = (observers: SessionObserver[] = []): Middleware<{}, IAppState> => {
  return ({ dispatch, getState }) => {
    let watchChanges = false

    const init = (options: NetMiddlewareOptions) => {
      if (options.host) {
        dispatch(initHostSession() as any)
        notifyObservers()
        watchChanges = true
      }
    }

    const notifyObservers = () => {
      const { session } = getState()
      console.debug('Session state changed', session)
      observers.forEach(observer => observer.onChange(session))
    }

    const compareState = (state: IAppState, prevState: IAppState) => {
      let sessionData

      const prevMedia = getCurrentMedia(prevState)
      const media = getCurrentMedia(state)

      // Update screen
      if (state.router.location !== prevState.router.location) {
        const { location } = state.router
        sessionData = {
          ...(sessionData || {}),
          screenPath: location ? location.pathname : undefined
        }
      }

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
        return
      }

      if (!isEqual(state.session, prevState.session)) {
        notifyObservers()
      }
    }

    return next => action => {
      if (isType(action, NetActions.connect)) {
        init(action.payload)
      } else if (isType(action, NetActions.disconnect)) {
        watchChanges = false
      }

      const prevState = getState()
      const result = next(action)
      const state = getState()

      if (watchChanges) {
        compareState(state, prevState)
      }

      return result
    }
  }
}
