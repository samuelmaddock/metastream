import fs from 'fs-extra'
import path from 'path';
import { app, ipcMain, webContents } from 'electron'

import log from 'browser/log'
import { keyPair, KeyPair, Key } from './crypto';
import { ILobbyOptions, ILobbySession } from 'renderer/platform/types';

import * as swarm from './server'
import { SimplePeer } from 'simple-peer';

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
  try {
    id = await initIdentity()
  } catch (e) {
    id = ''
    log.error('Failed to initialize swarm identity')
  } finally {
    event.returnValue = id
  }
})

let swarmServer: any
let serverOpts: ILobbyOptions

ipcMain.on('platform-create-lobby', (event: Electron.Event, opts: ILobbyOptions) => {
  const { sender } = event;

  if (swarmServer) {
    log.error('Attempt to create new swarm server without closing existing server.')
    event.sender.send('platform-create-lobby-result', false)
    return
  }

  serverOpts = opts
  swarmServer = swarm.listen({
    ...localKeyPair
  }, (peer: SimplePeer, peerKey: Key) => {
    // TODO: redesign to return encrypted socket?
    // Need to signal rtc data to the renderer
    log(`New swarm connection from ${peerKey.toString('hex')}`)
  })

  log('Swarm server now listening...')

  event.sender.send('platform-create-lobby-result', true)
})

ipcMain.on('platform-leave-lobby', (event: Electron.Event) => {
  if (swarmServer) {
    swarmServer.close()
    swarmServer = null
  } else {
    log.error('Attempt to leave unconnected swarm server')
  }
})

ipcMain.on('platform-join-lobby', (event: Electron.Event, serverId: string) => {
  if (swarmServer) {
    log.error('Attempt to join lobby while hosting existing swarm server')
    return
  }

  // TODO: check if serverId is an IP, not a public key

  const hostPublicKey = Buffer.from(serverId, 'hex')
  swarm.connect({
    ...localKeyPair,
    hostPublicKey
  })
})

