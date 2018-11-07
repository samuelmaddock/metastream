import { ipcMain } from 'electron'
import log from 'browser/log'
import { ILobbyOptions } from 'renderer/platform/types'
import { SwarmClient } from './client'

function checkNativeDeps() {
  try {
    require('utp-native')
  } catch (e) {
    log.error('Failed to load utp-native')
    log.error(e)
  }
}

const swarmClients = new Map<number, SwarmClient>()
const getSwarmClient = (event: Electron.Event) => swarmClients.get(event.sender.id)

ipcMain.on('platform-swarm-init', async (event: Electron.Event) => {
  const client = new SwarmClient(event.sender)
  swarmClients.set(event.sender.id, client)

  const isMainWindow = event.sender.id === 1
  const identity = await client.initIdentity(isMainWindow)
  event.returnValue = identity
})

ipcMain.on('platform-create-lobby', (event: Electron.Event, ipcId: number, opts: ILobbyOptions) => {
  checkNativeDeps()
  const client = getSwarmClient(event)
  if (client) {
    client.createLobby(opts)
  }
  event.sender.send('platform-create-lobby-result', ipcId, true)
})

ipcMain.on('platform-leave-lobby', (event: Electron.Event) => {
  const client = getSwarmClient(event)
  if (client) {
    client.leaveLobby()
  }
})

ipcMain.on(
  'platform-join-lobby',
  async (event: Electron.Event, ipcId: number, serverId: string) => {
    checkNativeDeps()
    let success = false
    const client = getSwarmClient(event)
    if (client) {
      success = await client.joinLobby(serverId)
    }
    event.sender.send('platform-join-lobby-result', ipcId, success)
  }
)
