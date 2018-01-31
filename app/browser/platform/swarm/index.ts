import fs from 'fs'
import { promisify } from 'util'
import { app, ipcMain, webContents } from 'electron'
import sodium from 'sodium-universal'

const statAsync = promisify(fs.stat)
const readFileAsync = promisify(fs.readFile)

import log from 'browser/log'

async function initIdentity() {
  // 1. check if identity exists
  const keyPath = app.getPath('userData')

  const stat = await statAsync(keyPath)

  log('got stats', stat)

  // 2. create keypair
  // 3. save keypair on disk
  // 4. send id back to sender

  return false
}

ipcMain.on('platform-swarm-init', async (event: Electron.Event) => {
  const result = await initIdentity()
  event.returnValue = result
})
