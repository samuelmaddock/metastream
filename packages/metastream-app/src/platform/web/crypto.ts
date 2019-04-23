import sodium from 'libsodium-wrappers'

export type Key = Buffer
export type KeyHexString = string

export type KeyPair = {
  publicKey: Key
  secretKey: Key
}

export async function keyPair(): Promise<KeyPair> {
  await sodium.ready
  const { publicKey, privateKey } = sodium.crypto_box_keypair()
  return {
    publicKey: Buffer.from(publicKey as any),
    secretKey: Buffer.from(privateKey as any)
  }
}
