import { Middleware, MiddlewareAPI, Action, Dispatch, AnyAction } from 'redux'

export const BEFORE_INSTALL_PROMPT = 'pwa/BEFORE_INSTALL_PROMPT'
export const SHOW_INSTALL_PROMPT = 'pwa/SHOW_INSTALL_PROMPT'
export const APP_INSTALLED = 'pwa/APP_INSTALLED'

export const pwaMiddleware = (): Middleware => store => {
  let promptEvent: any

  window.addEventListener('beforeinstallprompt', (e: any) => {
    promptEvent = e
    store.dispatch({ type: BEFORE_INSTALL_PROMPT })
  })

  window.addEventListener('appinstalled', () => {
    store.dispatch({ type: APP_INSTALLED })
  })

  return next => <A extends Action>(action: A): Action | undefined => {
    if (action.type === SHOW_INSTALL_PROMPT && promptEvent) {
      promptEvent.prompt()
      return
    }
    return next(<A>action)
  }
}
