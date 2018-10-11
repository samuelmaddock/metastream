import { Middleware } from 'redux'
import { IAppState } from '../../reducers/index'
const { ipcRenderer } = chrome

const discordInviteMiddleware = (): Middleware<{}, IAppState> => {
  return ({ dispatch, getState }) => {
    ipcRenderer.on('discord-join', (event: Electron.Event, secret: string) => {
      console.debug('Discord join secret', secret)
    })

    ipcRenderer.on('discord-join-request', (event: Electron.Event, user: any) => {
      console.debug('Discord join request', user)
    })

    return next => action => {
      // TODO
      return next(action)
    }
  }
}

export default discordInviteMiddleware
