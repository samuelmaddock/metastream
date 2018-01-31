import fs from 'fs-extra'
import path from 'path';
import { app, ipcMain, webContents } from 'electron'

import log from 'browser/log'
import { keyPair } from './crypto';

let localId: string
let localKeys

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
    localKeys = keyPair()
    await fs.writeFile(keyPath, localKeys.publicKey)
    await fs.writeFile(skeyPath, localKeys.secretKey)
  } else {
    localKeys = {
      publicKey: await fs.readFile(keyPath),
      secretKey: await fs.readFile(skeyPath)
    }
  }

  // 4. send id back to sender
  localId = localKeys.publicKey.toString('hex')
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
