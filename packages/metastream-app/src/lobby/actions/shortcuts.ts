import { IAppState } from 'reducers'

import { server_requestNextMedia, server_requestPlayPause } from 'lobby/actions/mediaPlayer'
import { AppThunkAction } from 'types/redux-thunk'
import { ThunkDispatch } from 'redux-thunk'

const dispatchCommand = (cmd: string, dispatch: ThunkDispatch<IAppState, any, any>) => {
  switch (cmd) {
    case 'media:next':
      dispatch(server_requestNextMedia())
      break
    case 'media:playpause':
      dispatch(server_requestPlayPause())
      break
  }
}

export const registerMediaShortcuts = (): AppThunkAction => {
  return () => {
    // TODO: listen for media hotkeys
  }
}

export const unregisterMediaShortcuts = (): AppThunkAction => {
  return () => {}
}
