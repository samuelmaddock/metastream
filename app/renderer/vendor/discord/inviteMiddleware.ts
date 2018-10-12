import { Middleware } from 'redux'
import { IAppState } from '../../reducers/index'
import { addUserInvite, answerUserInvite } from '../../lobby/actions/users'
import { isType } from 'utils/redux'
import { ipcMain } from 'electron'
const { ipcRenderer } = chrome

const discordInviteMiddleware = (): Middleware<{}, IAppState> => {
  return ({ dispatch, getState }) => {
    ipcRenderer.on('discord-join', (event: Electron.Event, secret: string) => {
      console.debug('Discord join secret', secret)
      // TODO
    })

    ipcRenderer.on('discord-join-request', (event: Electron.Event, user: any) => {
      console.debug('Discord join request', user)
      dispatch(
        addUserInvite({
          type: 'discord',
          id: user.userId,
          name: user.username,
          avatar: `https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png`,
          meta: user
        })
      )
    })

    return next => action => {
      if (isType(action, answerUserInvite) && action.payload.type === 'discord') {
        ipcRenderer.send('send-discord-reply', action.payload.meta, action.payload.response)
      }
      return next(action)
    }
  }
}

export default discordInviteMiddleware
