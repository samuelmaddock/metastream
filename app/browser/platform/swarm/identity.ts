import path from 'path'
import fs from 'fs-extra'
import { app } from 'electron'
import log from 'browser/log'
import { keyPair, KeyPair, Key } from './crypto'

let localId: string
let localKeyPair: KeyPair

const KEYNAME = 'idkey'

export async function initIdentity() {
  // 1. check if identity exists
  const userPath = app.getPath('userData')
  const userDataPath = path.join(userPath, 'userdata')
  const keyPath = path.join(userPath, `${KEYNAME}.pub`)
  const skeyPath = path.join(userPath, KEYNAME)

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

export function getKeyPair() {
  return localKeyPair
}
