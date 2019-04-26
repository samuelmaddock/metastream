import sodium from 'libsodium-wrappers'
import { Key } from '../types'

type Data = Uint8Array

export const keyPair = () => sodium.crypto_box_keypair()

export const seal = (msg: Data, publicKey: Key) => sodium.crypto_box_seal(msg, publicKey)

export const unseal = (cipher: Data, publicKey: Key, secretKey: Key) => {
  if (cipher.length < sodium.crypto_box_SEALBYTES) return null
  let msg
  try {
    msg = sodium.crypto_box_seal_open(cipher, publicKey, secretKey)
  } catch (e) {
    return null
  }
  return msg
}

export const scalarMultiplication = (privateKey: Key, otherPublicKey: Key) =>
  sodium.crypto_scalarmult(privateKey, otherPublicKey)

export const nonce = () => sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)

export const encrypt = (msg: Data, nonce: Data, key: Key) =>
  sodium.crypto_secretbox_easy(msg, nonce, key)

export const decrypt = (cipher: Data, nonce: Data, key: Key) => {
  if (cipher.length < sodium.crypto_secretbox_MACBYTES) return null
  let msg
  try {
    msg = sodium.crypto_secretbox_open_easy(cipher, nonce, key)
  } catch (e) {
    return null
  }
  return msg
}

export const equal = (a: Data, b: Data) => sodium.to_hex(a) === sodium.to_hex(b)
