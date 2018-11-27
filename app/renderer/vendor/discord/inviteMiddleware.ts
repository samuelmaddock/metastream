import { Middleware } from 'redux'
import { IAppState } from '../../reducers/index'
import { addUserInvite, answerUserInvite } from '../../lobby/actions/users'
import { isType } from 'utils/redux'
import { addChat } from '../../lobby/actions/chat'
import { decodeDiscordSecret } from './secret'
import { push } from 'react-router-redux'
import { translateEscaped } from 'locale'
const { ipcRenderer } = chrome

const DISCORD_INVITE_TIMEOUT = 30e3

const discordInviteMiddleware = (): Middleware<{}, IAppState> => {
  return ({ dispatch, getState }) => {
    let pendingInviteTimers = new Map<string, number>()

    ipcRenderer.on('discord-join', (event: Electron.Event, secret: string) => {
      console.debug('Discord join secret', secret)

      let data
      try {
        data = decodeDiscordSecret(secret)
      } catch {}

      if (data) {
        dispatch(push(`/lobby/${data.id}?secret=${data.secret}`))
      }
    })

    ipcRenderer.on('discord-join-request', (event: Electron.Event, request: any) => {
      const { user } = request
      console.debug('Discord join request', user)

      const username = `${user.username}#${user.discriminator}`

      const content = translateEscaped('noticeUserRequestJoin', { userId: '', username })
      dispatch(addChat({ content, timestamp: Date.now() }))

      dispatch(
        addUserInvite({
          type: 'discord',
          id: user.id,
          name: username,
          avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
          meta: user
        })
      )

      const timeoutId = setTimeout(() => {
        dispatch(answerUserInvite({ ...user, response: 'IGNORE' }))
      }, DISCORD_INVITE_TIMEOUT)

      pendingInviteTimers.set(user.id, (timeoutId as any) as number)
    })

    return next => action => {
      if (isType(action, answerUserInvite) && action.payload.type === 'discord') {
        const invite = action.payload
        ipcRenderer.send('send-discord-reply', invite.meta, invite.response)

        if (pendingInviteTimers.has(invite.id)) {
          const timerId = pendingInviteTimers.get(invite.id)
          clearTimeout(timerId)
          pendingInviteTimers.delete(invite.id)
        }
      }
      return next(action)
    }
  }
}

export default discordInviteMiddleware
