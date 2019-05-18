const process = require('process')

const sodium = require('libsodium-wrappers')
const WebSocket = require('ws')
const wrtc = require('wrtc')

global.WebSocket = WebSocket

const createServer = require('./lib').default
const createClient = require('./lib/client').default
const { waitEvent } = require('./lib/util')

process.on('unhandledRejection', err => {
  console.error(err)
  process.exit(1)
})

const port = 9000
let keypair

const peerOpts = {
  wrtc
}

async function main() {
  await sodium.ready

  keypair = sodium.crypto_box_seed_keypair(sodium.from_string('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'))

  let server = await createServer({ port })
  console.log(`Server listening at 127.0.0.1:${port}`)

  const clientA = await createClient({
    peerOpts,
    server: `ws://127.0.0.1:${port}`
  })

  await clientA.createRoom(keypair)

  const clientB = await createClient({
    peerOpts,
    server: `ws://127.0.0.1:${port}`
  })

  clientA.once('peer', () => {
    console.log('Client B connected to Client A')
  })
  clientB.once('peer', () => {
    console.log('Client A connected to Client B')
  })

  await clientB.joinRoom(sodium.to_hex(keypair.publicKey))

  // Overwrite client A room
  const clientC = await createClient({
    peerOpts,
    server: `ws://127.0.0.1:${port}`
  })
  await clientC.createRoom(keypair)

  clientA.close()
  clientB.close()
  clientC.close()
  server.close()
}

main()
