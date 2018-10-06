const { ipcRenderer } = chrome
import { Dispatch } from 'react-redux'
import { IAppState } from 'renderer/reducers'

import {
  server_requestNextMedia,
  server_requestPlayPause
} from 'renderer/lobby/actions/mediaPlayer'
import { AppThunkAction } from 'types/redux-thunk'
import { ThunkDispatch } from 'redux-thunk'

let unregister: Function | undefined

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
  return (dispatch, getState, extra) => {
    const onCommand = (sender: Electron.WebContents, cmd: string) =>
      dispatch(dispatchCommand.bind(null, cmd))

    ipcRenderer.on('command', onCommand)

    unregister = () => {
      ipcRenderer.removeListener('command', onCommand)
    }
  }
}

export const unregisterMediaShortcuts = (): AppThunkAction => {
  return (dispatch, getState) => {
    if (unregister) {
      unregister()
      unregister = undefined
    }
  }
}
