import { Middleware } from 'redux'
import { isType } from 'utils/redux'
import { NetActions, NetMiddlewareOptions } from '../../network/actions'
import { initHostSession, setSessionData } from '../actions/session'
import { IAppState } from '../../reducers/index'
import { getCurrentMedia } from '../reducers/mediaPlayer.helpers'

export const sessionMiddleware = (): Middleware<{}, IAppState> => {
  return store => {
    const { dispatch, getState } = store

    const init = (options: NetMiddlewareOptions) => {
      if (options.host) {
        dispatch(initHostSession() as any)
      }
    }

    return next => action => {
      if (isType(action, NetActions.connect)) {
        init(action.payload)
      }
      const prevState = getState()
      const result = next(action)
      const state = getState()

      const prevMedia = getCurrentMedia(prevState)
      const media = getCurrentMedia(state)

      // Update session media state
      if (media !== prevMedia) {
        dispatch(
          setSessionData({
            media: media && {
              url: media.requestUrl,
              title: media.title,
              thumbnail: media.imageUrl
            }
          })
        )
      }

      return result
    }
  }
}
