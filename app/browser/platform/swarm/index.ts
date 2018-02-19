import fs from 'fs-extra'
import path from 'path'
import { app, ipcMain, webContents } from 'electron'
const { productName } = require('package.json')

import log from 'browser/log'
import { keyPair, KeyPair, Key } from './crypto'
import { ILobbyOptions, ILobbySession } from 'renderer/platform/types'

import * as swarm from 'swarm-server'
import { EncryptedSocket } from 'swarm-server'
import { SimplePeer } from 'simple-peer'
import { signalRenderer } from 'browser/platform/swarm/signal'
import { NETWORK_TIMEOUT } from 'constants/network'
import { sleep } from 'utils/async'
import * as username from 'username'

function checkNativeDeps() {
  try {
    require('utp-native')
  } catch (e) {
    log.error('Failed to load utp-native')
    log.error(e)
  }
}

let localId: string
let localKeyPair: KeyPair

async function initIdentity() {
  // 1. check if identity exists
  const userPath = app.getPath('userData')
  const userDataPath = path.join(userPath, 'userdata')
  const keyPath = path.join(userPath, 'key.pub')
  const skeyPath = path.join(userPath, 'key')

  const exists = await fs.pathExists(keyPath)

  // TODO: allow multiple userdata dirs with unique keypairs

  // 2. create keypair
  if (!exists) {
    // 3. save keypair on disk
    localKeyPair = keyPair()
    await fs.writeFile(keyPath, localKeyPair.publicKey)
    await fs.writeFile(skeyPath, localKeyPair.secretKey)
  } else {
    localKeyPair = {
      publicKey: await fs.readFile(keyPath),
      secretKey: await fs.readFile(skeyPath)
    }
  }

  // 4. send id back to sender
  localId = localKeyPair.publicKey.toString('hex')
  log(`Init swarm ID: ${localId}`)

  return localId
}

ipcMain.on('platform-swarm-init', async (event: Electron.Event) => {
  let id
  let name = (await username()) || productName
  try {
    id = await initIdentity()
  } catch (e) {
    id = ''
    log.error('Failed to initialize swarm identity')
  } finally {
    event.returnValue = {
      id,
      username: name
    }
  }
})

let swarmServer: any
let serverOpts: ILobbyOptions

ipcMain.on('platform-create-lobby', (event: Electron.Event, opts: ILobbyOptions) => {
  const { sender } = event

  checkNativeDeps()

  if (swarmServer) {
    log.error('Attempt to create new swarm server without closing existing server.')
    swarmServer.close()
    swarmServer = null
  }

  serverOpts = opts
  swarmServer = swarm.listen({ ...localKeyPair, convert: true }, async (esocket, peerKey) => {
    const keyStr = peerKey.toString('hex')
    log(`New swarm connection from ${keyStr}`)

    try {
      log(`${keyStr} signaling renderer`)
      await signalRenderer(esocket, peerKey)
      log(`${keyStr} connected to renderer`)
    } catch (e) {
      log.error(`Failed to connect to peer ${keyStr}:`, e)
    }

    esocket.destroy()
  })

  log('Swarm server now listening...')

  event.sender.send('platform-create-lobby-result', true)
})

ipcMain.on('platform-leave-lobby', (event: Electron.Event) => {
  if (swarmServer) {
    swarmServer.close()
    swarmServer = null
    log('Closed swarm server connection')
  }
})

ipcMain.on('platform-join-lobby', async (event: Electron.Event, serverId: string) => {
  // TODO: check if already connected
  // TODO: check if serverId is an IP, not a public key

  checkNativeDeps()

  const hostPublicKey = Buffer.from(serverId, 'hex')
  let esocket

  try {
    esocket = await swarm.connect({
      ...localKeyPair,
      hostPublicKey,
      convert: true
    })
  } catch (e) {
    log.error(`Join lobby error`, e)
  }

  const success = !!esocket
  event.sender.send('platform-join-lobby-result', success)

  if (esocket) {
    try {
      await signalRenderer(esocket, hostPublicKey)
      log(`Finished signaling connection to host ${serverId}`)
    } catch (e) {
      log.error(`Failed to connect to peer ${serverId}\n`, e)
    }

    esocket.destroy()
  }
})
