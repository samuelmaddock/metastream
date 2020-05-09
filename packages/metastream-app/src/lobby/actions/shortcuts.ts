import { IAppState } from 'reducers'

import { server_requestPlayPause, server_requestSeekRelative } from 'lobby/actions/mediaPlayer'
import { AppThunkAction } from 'types/redux-thunk'
import { ThunkDispatch } from 'redux-thunk'
import { addVolume } from 'actions/settings'
import { throttle } from 'lodash-es'

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

type ActionHandler = (dispatch: ThunkDispatch<IAppState, any, any>, repeatDuration: number) => void

// Increase rate as key is held down longer
const getRateScalar = (durationMs: number) => {
  if (durationMs > 5e3) return 5
  else if (durationMs > 2e3) return 2
  else return 1
}

const ActionHandlers: { [key in HotKeyAction]: ActionHandler } = {
  [HotKeyAction.PlayPause]: throttle(dispatch => dispatch(server_requestPlayPause()), 100, {
    trailing: false
  }),
  [HotKeyAction.DecreaseVolume]: dispatch => dispatch(addVolume(-0.05)),
  [HotKeyAction.IncreaseVolume]: dispatch => dispatch(addVolume(0.05)),
  [HotKeyAction.SeekBackward]: throttle(
    (dispatch, repeatDuration) =>
      dispatch(server_requestSeekRelative(-5e3 * getRateScalar(repeatDuration))),
    200,
    { trailing: false }
  ),
  [HotKeyAction.SeekForward]: throttle(
    (dispatch, repeatDuration) =>
      dispatch(server_requestSeekRelative(5e3 * getRateScalar(repeatDuration))),
    200,
    { trailing: false }
  )
}

const keyRepeatDuration: { [key: string]: number | undefined } = {}

function onDocumentKeyDown(dispatch: ThunkDispatch<IAppState, any, any>, event: KeyboardEvent) {
  // Ignore inputs entered while typing (ie. in the chat box)
  const { activeElement } = document
  if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
    // Continue if we haven't typed anything yet
    if (activeElement.value.length > 0) return
  }

  let hotkey = event.code
  if (event.shiftKey) hotkey = `Shift+${hotkey}`
  if (event.ctrlKey || event.metaKey) hotkey = `Ctrl+${hotkey}`

  const action = ActionMap[hotkey]
  if (typeof action === 'undefined') return

  event.preventDefault()
  event.stopImmediatePropagation()

  if (!event.repeat || !keyRepeatDuration[action]) {
    keyRepeatDuration[action] = Date.now()
  }

  const repeatDuration = Date.now() - (keyRepeatDuration[action] || Date.now())

  const handler = ActionHandlers[action]
  handler(dispatch, repeatDuration)
}

let keyDownHandler: any

export const registerMediaShortcuts = (): AppThunkAction => {
  return (dispatch, getState) => {
    keyDownHandler = onDocumentKeyDown.bind(null, dispatch)
    document.addEventListener('keydown', keyDownHandler, false)
  }
}

export const unregisterMediaShortcuts = (): AppThunkAction => {
  return () => {
    document.removeEventListener('keydown', keyDownHandler, false)
    keyDownHandler = undefined
  }
}
