import sodium from 'sodium-universal'

export type Key = Buffer
export type KeyHexString = string

export type KeyPair = {
  publicKey: Key;
  secretKey: Key;
}

export function keyPair(seed?: string): KeyPair {
  const publicKey = new Buffer(sodium.crypto_sign_PUBLICKEYBYTES)
  const secretKey = new Buffer(sodium.crypto_sign_SECRETKEYBYTES)

  if (seed) sodium.crypto_sign_seed_keypair(publicKey, secretKey, seed)
  else sodium.crypto_sign_keypair(publicKey, secretKey)

  return {
    publicKey: publicKey,
    secretKey: secretKey
  }
}
