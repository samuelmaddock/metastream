import { IAppState } from 'reducers'

import { server_requestPlayPause, server_requestSeekRelative } from 'lobby/actions/mediaPlayer'
import { AppThunkAction } from 'types/redux-thunk'
import { ThunkDispatch } from 'redux-thunk'

const enum HotKeyAction {
  PlayPause,
  DecreaseVolume,
  IncreaseVolume,
  SeekBackward,
  SeekForward
}

const ActionMap: { [key: string]: HotKeyAction } = {
  Space: HotKeyAction.PlayPause,
  ArrowDown: HotKeyAction.DecreaseVolume,
  ArrowUp: HotKeyAction.IncreaseVolume,
  ArrowLeft: HotKeyAction.SeekBackward,
  ArrowRight: HotKeyAction.SeekForward
}

type ActionHandler = (dispatch: ThunkDispatch<IAppState, any, any>) => void

// TODO: throttle handlers
// TODO: clear throttle cooldowns on keyup
const ActionHandlers: { [key in HotKeyAction]: ActionHandler } = {
  [HotKeyAction.PlayPause]: dispatch => dispatch(server_requestPlayPause()),
  [HotKeyAction.DecreaseVolume]: dispatch => {
    /* TODO */
  },
  [HotKeyAction.IncreaseVolume]: dispatch => {
    /* TODO */
  },
  // TODO: when held down for awhile, change relative seek to 1 minute, then 5 minutes
  [HotKeyAction.SeekBackward]: dispatch => dispatch(server_requestSeekRelative(-5e3)),
  [HotKeyAction.SeekForward]: dispatch => dispatch(server_requestSeekRelative(5e3))
}

function onDocumentKeyDown(
  dispatch: ThunkDispatch<IAppState, any, any>,
  getState: () => IAppState,
  event: KeyboardEvent
) {
  // Ignore inputs entered while typing (ie. in the chat box)
  const { activeElement } = document
  if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
    // Continue if we haven't typed anything yet
    if (activeElement.value.length > 0) return
  }

  let hotkey = event.code
  if (event.shiftKey) hotkey = `Shift+${hotkey}`

  const action = ActionMap[hotkey]
  if (typeof action === 'undefined') return

  event.preventDefault()
  event.stopImmediatePropagation()

  const handler = ActionHandlers[action]
  handler(dispatch)
}

let keyDownHandler: any

export const registerMediaShortcuts = (): AppThunkAction => {
  return (dispatch, getState) => {
    keyDownHandler = onDocumentKeyDown.bind(null, dispatch, getState)
    document.addEventListener('keydown', keyDownHandler, false)
  }
}

export const unregisterMediaShortcuts = (): AppThunkAction => {
  return () => {
    document.removeEventListener('keydown', keyDownHandler, false)
    keyDownHandler = undefined
  }
}
