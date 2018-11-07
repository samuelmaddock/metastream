import { ipcMain } from 'electron'
import * as IPCStream from 'electron-ipc-stream'
import * as swarm from 'swarm-peer-server'

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

ipcMain.on(
  'create-auth-stream',
  (event: Electron.Event, ipcId: number, hostPublicKeyStr: string) => {
    const client = getSwarmClient(event)
    if (!client || !client.keyPair) return

    log.debug(`create-auth-stream`)

    const streamChannel = `auth/${hostPublicKeyStr}`
    const stream = new IPCStream(streamChannel, event.sender)
    stream.destroy = stream.end // HACK for esocket

    const hostPublicKey = Buffer.from(hostPublicKeyStr, 'hex')

    log.debug(`create-auth-stream: connecting to host`)

    // create EncryptedSocket and perform auth
    const esocket = new swarm.EncryptedSocket(
      stream,
      client.keyPair.publicKey,
      client.keyPair.secretKey
    )
    esocket.connect(hostPublicKey)

    esocket.once('connection', () => {
      log.debug('Connected to auth')
      esocket.destroy()
      event.sender.send('create-auth-stream-result', ipcId, true)
    })

    esocket.once('error', err => {
      log.error(err)
      esocket.destroy()
      event.sender.send('create-auth-stream-result', ipcId, false)
    })
  }
)
