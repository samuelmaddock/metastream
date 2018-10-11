import { ipcMain } from 'electron'
import { throttle } from 'lodash'
import * as DiscordRPC from 'discord-rpc'
import log from '../log'

let discordRpc: any | null = null
let initialized = false

const init = () => {
  return new Promise((resolve, reject) => {
    const clientId = process.env.DISCORD_CLIENT_ID
    if (!clientId) {
      throw new Error('Discord Client ID not configured.')
    }

    DiscordRPC.register(clientId)

    const rpc = new DiscordRPC.Client({ transport: 'ipc' })
    discordRpc = rpc

    rpc.once('ready', () => {
      initialized = true
      resolve()
    })

    try {
      rpc.login({ clientId })
    } catch (e) {
      log.error(e)
      return
    }
  })
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
  updateActivity(activity)
})
