import path from 'path'
import fs from 'fs-extra'
import { app } from 'electron'
import { keyPair, KeyPair } from './crypto'
import sodium from 'libsodium-wrappers'

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

  // convert old sodium-native keys to use new length compatible with libsodium-wrappers
  if (localKeyPair.secretKey.length > sodium.crypto_box_PUBLICKEYBYTES) {
    localKeyPair.secretKey = localKeyPair.secretKey.slice(0, sodium.crypto_box_PUBLICKEYBYTES)
  }

  return localKeyPair
}
