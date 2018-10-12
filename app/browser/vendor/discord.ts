import { ipcMain } from 'electron'
import { throttle } from 'lodash'
import * as DiscordRPC from 'discord-rpc'
import log from '../log'
import { getMainWindow } from '../window'

let discordRpc: any | null = null
let activityCache: DiscordActivity | null = null

const init = async () => {
  const clientId = process.env.DISCORD_CLIENT_ID
  if (!clientId) {
    throw new Error('Discord Client ID not configured.')
  }

  DiscordRPC.register(clientId)

  const rpc = new DiscordRPC.Client({ transport: 'ipc' })
  discordRpc = rpc

  rpc.once('ready', () => {
    log.info('Discord RPC ready', discordRpc.user)

    const send = (eventName: string, ...args: any[]) => {
      const win = getMainWindow()
      if (win) {
        win.webContents.send(eventName, ...args)
      }
    }

    rpc.subscribe('ACTIVITY_JOIN', ({ secret }: any) => send('discord-join', secret))
    rpc.subscribe('ACTIVITY_JOIN_REQUEST', (user: any) => send('discord-join-request', user))

    if (activityCache) {
      updateActivity(activityCache)
      activityCache = null
    }
  })

  try {
    await rpc.login({ clientId })
  } catch (e) {
    log.error(e)
    return
  }
}

const updateActivity = throttle(async (activity: DiscordActivity) => {
  if (!discordRpc) return
  try {
    await discordRpc.setActivity(activity)
  } catch (e) {
    log.error(e)
  }
}, 15e3)

ipcMain.on('set-discord-enabled', (event: Electron.Event, enabled: boolean) => {
  if (enabled && !discordRpc) {
    init()
  } else if (!enabled && discordRpc) {
    discordRpc.destroy()
    discordRpc = null
  }
})

ipcMain.on('set-discord-activity', (event: Electron.Event, activity: DiscordActivity) => {
  if (discordRpc) {
    updateActivity(activity)
  } else {
    activityCache = activity
  }
})

ipcMain.on('send-discord-reply', async (event: Electron.Event, user: any, response: string) => {
  if (!discordRpc) return

  let responsePromise

  switch (response) {
    case 'YES':
      responsePromise = discordRpc.sendJoinInvite(user)
      break
    case 'NO':
    case 'IGNORE':
      responsePromise = discordRpc.closeJoinRequest(user)
      break
    default:
      log.error('Unknown Discord response')
      return
  }

  if (responsePromise) {
    try {
      await responsePromise
    } catch (e) {
      log.error(e)
    }
  }
})
