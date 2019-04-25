import sodium from 'libsodium-wrappers'

export const keyPair = () => sodium.crypto_box_keypair()
