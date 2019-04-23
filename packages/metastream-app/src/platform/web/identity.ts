import { keyPair, KeyPair } from './crypto'
import sodium from 'libsodium-wrappers'

const KEYNAME = 'identity'
const PUBKEY_PROP = `${KEYNAME}.pub`
const SECKEY_PROP = KEYNAME

export async function initIdentity(ephemeral: boolean = false) {
  await sodium.ready

  if (ephemeral) {
    return keyPair()
  }

  let localKeyPair

  {
    const publicKey = localStorage.getItem(PUBKEY_PROP)
    const secretKey = localStorage.getItem(SECKEY_PROP)

    if (publicKey && secretKey) {
      localKeyPair = {
        publicKey: sodium.from_hex(publicKey),
        secretKey: sodium.from_hex(secretKey)
      }
    }
  }

  if (!localKeyPair) {
    localKeyPair = keyPair()

    try {
      localStorage.setItem(PUBKEY_PROP, sodium.to_hex(localKeyPair.publicKey))
      localStorage.setItem(SECKEY_PROP, sodium.to_hex(localKeyPair.secretKey))
    } catch (e) {}
  }

  return localKeyPair
}
