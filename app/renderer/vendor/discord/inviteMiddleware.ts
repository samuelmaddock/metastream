import { Middleware } from 'redux'
import { IAppState } from '../../reducers/index'
import { addUserInvite, answerUserInvite } from '../../lobby/actions/users'
import { isType } from 'utils/redux'
import { addChat } from '../../lobby/actions/chat'
const { ipcRenderer } = chrome

const discordInviteMiddleware = (): Middleware<{}, IAppState> => {
  return ({ dispatch, getState }) => {
    ipcRenderer.on('discord-join', (event: Electron.Event, secret: string) => {
      console.debug('Discord join secret', secret)
      // TODO
    })

    ipcRenderer.on('discord-join-request', (event: Electron.Event, request: any) => {
      const { user } = request
      console.debug('Discord join request', user)

      dispatch(
        addChat({
          content: `${user.username} is requesting permission to join.`,
          timestamp: Date.now()
        })
      )

      dispatch(
        addUserInvite({
          type: 'discord',
          id: user.id,
          name: user.username,
          avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
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
