import sodium from 'libsodium-wrappers'
import SimplePeer from 'simple-peer'
import { NetConnection } from 'network'
import { KeyPair, Key } from '../types'
import { Duplex } from 'stream'
import { waitEvent } from '@metastream/signal-server/lib/util'
import * as crypto from './crypto'

const SUCCESS = sodium.from_string('success')

/** Performs mutual authentication with the remote peer. */
export async function mutualHandshake(socket: Duplex, keyPair: KeyPair, serverPublicKey?: Key) {
  let sharedKey: Key | undefined
  let verifiedPeerKey: Key | undefined

  function createSharedKey(peerPublicKey: Key) {
    sharedKey = crypto.scalarMultiplication(keyPair.privateKey, peerPublicKey)
  }

  function encrypt(data: Uint8Array) {
    if (!sharedKey) return null
    const nonce = crypto.nonce()
    const box = crypto.encrypt(data, nonce, sharedKey)
    const msg = new Uint8Array(nonce.length + box.length)
    msg.set(nonce)
    msg.set(box, nonce.length)
    return msg
  }

  /** Decrypt data used shared key */
  function decrypt(data: Uint8Array) {
    if (!sharedKey) return null
    const nonce = data.slice(0, sodium.crypto_box_NONCEBYTES)
    const box = data.slice(sodium.crypto_box_NONCEBYTES, data.length)
    const msg = crypto.decrypt(box, nonce, sharedKey)
    return msg
  }

  if (serverPublicKey) {
    // CLIENT
    const encryptedPublicKey = crypto.seal(keyPair.publicKey, serverPublicKey)
    socket.write(encryptedPublicKey)

    const [encChallenge] = await waitEvent(socket, 'data')
    createSharedKey(serverPublicKey)

    const challenge = decrypt(encChallenge)
    if (!challenge) {
      throw new Error('Failed to decrypt challenge')
    }

    socket.write(encrypt(challenge))

    const [encResult] = await waitEvent(socket, 'data')
    const result = decrypt(encResult)
    if (!result) {
      throw new Error('Failed to decrypt result')
    }

    if (crypto.equal(result, SUCCESS)) {
      verifiedPeerKey = serverPublicKey
    }
  } else {
    // SERVER
    const [encryptedPublicKey] = await waitEvent(socket, 'data')
    const peerPublicKey = crypto.unseal(encryptedPublicKey, keyPair.publicKey, keyPair.privateKey)
    if (!peerPublicKey) {
      throw new Error(`Failed to decrypt peer's public key`)
    }

    if (crypto.equal(keyPair.publicKey, peerPublicKey)) {
      throw new Error(`Handshake with identical keypair is unsupported`)
    }

    createSharedKey(peerPublicKey)

    const challenge = crypto.nonce()
    socket.write(encrypt(challenge))

    const [encChallengeResponse] = await waitEvent(socket, 'data')
    const challengeResponse = decrypt(encChallengeResponse)
    if (challengeResponse && crypto.equal(challengeResponse, challenge)) {
      socket.write(encrypt(SUCCESS))
      verifiedPeerKey = peerPublicKey
    }
  }

  return verifiedPeerKey
}
