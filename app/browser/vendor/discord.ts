import { ipcMain } from 'electron'
import { throttle } from 'lodash'
import * as DiscordRPC from 'discord-rpc'
import log from '../log'

let discordRpc: any
let initialized = false

const init = () => {
  return new Promise((resolve, reject) => {
    const clientId = process.env.DISCORD_CLIENT_ID
    if (!clientId) {
      throw new Error('Discord Client ID not configured.')
    }

    DiscordRPC.register(clientId)
    const rpc = new DiscordRPC.Client({ transport: 'ipc' })

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

    discordRpc = rpc
  })
}

const updateActivity = throttle(async (activity: DiscordActivity) => {
  try {
    await discordRpc.setActivity(activity)
  } catch (e) {
    log.error(e)
  }
}, 15e3)

// TODO: change to 'on' and apply session state
ipcMain.on('set-discord-activity', async (event: Electron.Event, activity: DiscordActivity) => {
  if (!initialized) {
    await init()
  }
  updateActivity(activity)
})
