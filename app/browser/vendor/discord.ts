import { ipcMain } from 'electron'
import { throttle } from 'lodash'
import * as DiscordRPC from 'discord-rpc'
import log from '../log'
import { ISessionState } from 'renderer/lobby/reducers/session'
import { PRODUCT_NAME } from 'constants/app'

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

const SCREEN_NAME: { [key: string]: string } = {
  '/': 'Main Menu',
  '/settings': 'Settings'
}

const updateActivity = throttle(async (state: ISessionState) => {
  const { media, screenPath } = state

  const activity = {
    details: media ? media.title : 'Nothing playing',
    state: media ? 'Watching' : SCREEN_NAME[screenPath as any] || 'In session',
    startTimestamp: Math.floor((state.startTime || new Date().getTime()) / 1000),
    largeImageKey: 'default',
    instance: false
  }

  log.info('Updating Discord activity', activity)

  try {
    await discordRpc.setActivity(activity)
  } catch (e) {
    log.error(e)
  }
}, 15e3)

// TODO: change to 'on' and apply session state
ipcMain.on('set-discord-activity', async (event: Electron.Event, state: ISessionState) => {
  if (!initialized) {
    await init()
  }

  log.info('RECEIVED', state)
  updateActivity(state)
})
