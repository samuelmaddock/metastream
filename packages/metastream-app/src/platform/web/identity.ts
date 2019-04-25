import { keyPair } from './crypto'
import sodium, { KeyPair } from 'libsodium-wrappers'

const KEYNAME = 'identity'
const PUBKEY_PROP = `${KEYNAME}.pub`
const SECKEY_PROP = KEYNAME

export async function initIdentity(ephemeral: boolean = false) {
  await sodium.ready

  if (ephemeral) {
    return keyPair()
  }

  let localKeyPair: KeyPair | undefined

  {
    const publicKey = localStorage.getItem(PUBKEY_PROP)
    const privateKey = localStorage.getItem(SECKEY_PROP)

    if (publicKey && privateKey) {
      localKeyPair = {
        publicKey: sodium.from_hex(publicKey),
        privateKey: sodium.from_hex(privateKey),
        keyType: 'curve25519'
      }
    }
  }

  if (!localKeyPair) {
    localKeyPair = keyPair()

    try {
      localStorage.setItem(PUBKEY_PROP, sodium.to_hex(localKeyPair.publicKey))
      localStorage.setItem(SECKEY_PROP, sodium.to_hex(localKeyPair.privateKey))
    } catch (e) {}
  }

  return localKeyPair
}
