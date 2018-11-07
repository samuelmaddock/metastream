import path from 'path'
import fs from 'fs-extra'
import { app } from 'electron'
import { keyPair, KeyPair } from './crypto'

const KEYNAME = 'idkey'

export async function initIdentity(ephemeral: boolean = false) {
  if (ephemeral) {
    return keyPair()
  }

  let localKeyPair: KeyPair

  // 1. check if identity exists
  const userPath = app.getPath('userData')
  const keyPath = path.join(userPath, `${KEYNAME}.pub`)
  const skeyPath = path.join(userPath, KEYNAME)

  const exists = await fs.pathExists(keyPath)

  // 2. create keypair
  if (!exists) {
    // 3. save keypair on disk
    localKeyPair = keyPair()
    try {
      await fs.writeFile(keyPath, localKeyPair.publicKey)
      await fs.writeFile(skeyPath, localKeyPair.secretKey)
    } catch (e) {}
  } else {
    try {
      localKeyPair = {
        publicKey: await fs.readFile(keyPath),
        secretKey: await fs.readFile(skeyPath)
      }
    } catch (e) {
      localKeyPair = keyPair()
    }
  }

  return localKeyPair
}
