import { ipcMain } from 'electron'
import { throttle } from 'lodash'
import * as DiscordRPC from 'discord-rpc'
import log from '../log'

let discordRpc: any

const init = async () => {
  const clientId = process.env.DISCORD_CLIENT_ID
  if (!clientId) {
    throw new Error('Discord Client ID not configured.')
  }

  DiscordRPC.register(clientId)
  const rpc = new DiscordRPC.Client({ transport: 'ipc' })

  rpc.once('ready', () => {
    updateActivity()
  })

  try {
    rpc.login({ clientId })
  } catch (e) {
    log.error(e)
    return
  }

  discordRpc = rpc
}

const updateActivity = throttle(() => {
  discordRpc.setActivity({
    details: 'details',
    state: 'state',
    startTimestamp: new Date(),
    largeImageKey: 'metastream_large',
    largeImageText: 'large image text',
    smallImageKey: 'metastream_small',
    smallImageText: 'small image text',
    instance: false
  })
}, 15e3)

// TODO: change to 'on' and apply session state
ipcMain.once('set-discord-activity', async () => {
  await init()
})
