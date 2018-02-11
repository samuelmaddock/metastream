import { NETWORK_TIMEOUT } from 'constants/network'
import { EncryptedSocket } from './socket'
import log from 'browser/log'

const sodium = require('sodium-native')
const discoverySwarm = require('discovery-swarm')
const swarmDefaults = require('dat-swarm-defaults')

const DISCOVERY_HASH = new Buffer('hypercore')

// +1 from Dat protocol default to reduce conflict
const DEFAULT_PORT = 3283

const SWARM_OPTS = {
  hash: false
}

function getSwarmOptions() {
  const opts = swarmDefaults(SWARM_OPTS)
  Object.assign(opts, {
    dns: Object.assign({}, opts.dns, {
      domain: 'metastream.local'
    }),
    dht: Object.assign({}, opts.dht),
  })
  return opts
}

// Get discovery key from original key
function getDiscoveryKey(tree) {
  var digest = new Buffer(32)
  sodium.crypto_generichash(digest, DISCOVERY_HASH, tree)
  return digest
}

function createSwarm(opts) {
  const swarmOpts = getSwarmOptions()
  log.info(`Swarm opts:`, swarmOpts)

  const swarm = discoverySwarm(swarmOpts)
  swarm.on('error', () => swarm.listen(0))
  swarm.listen(DEFAULT_PORT)
  swarm.join(opts.id, { announce: true })
  return swarm
}

async function authConnection(socket, opts) {
  return new Promise((resolve, reject) => {
    const esocket = new EncryptedSocket(socket, opts.publicKey, opts.secretKey)

    esocket.once('connection', () => resolve(esocket))
    esocket.once('error', () => {})
    esocket.once('close', reject)

    // TODO: timeout
    esocket.connect(opts.hostPublicKey)
  })
}

export function listen(opts, connectionHandler) {
  const discoveryKey = getDiscoveryKey(opts.publicKey)
  log(`Listen ${opts.publicKey.toString('hex')} => ${discoveryKey.toString('hex')}`)
  const swarm = createSwarm({ id: discoveryKey })

  // Wait for connections to perform auth handshake with
  swarm.on('connection', async socket => {
    const address = socket.address().address
    log(`Local swarm connection ${address}`)

    let esocket
    try {
      log(`Attempting to auth...`)
      esocket = await authConnection(socket, {
        publicKey: opts.publicKey,
        secretKey: opts.secretKey
      })
    } catch (e) {
      log.error('Failed to auth peer\n', e)
      return
    }

    log(`AUTHED WITH PEER! ${address}`)
    connectionHandler(esocket, esocket.peerKey)
  })

  return swarm
}

export function connect(opts) {
  return new Promise((resolve, reject) => {
    let timeoutId, timeout, connected
    const hostPublicKey = opts.hostPublicKey
    const discoveryKey = getDiscoveryKey(hostPublicKey)
    const swarm = createSwarm({ id: discoveryKey })

    log(`Connecting to remote swarm ${hostPublicKey.toString('hex')}`)

    let queue = []
    let connecting = false

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      queue.forEach(socket => socket.destroy())
      queue = []

      swarm.removeListener('connection', onConnection)

      if (!connected) {
        swarm.close()
      }
    }

    async function attemptConnect() {
      connecting = true

      let socket
      while (!connected && !timeout && (socket = queue.shift())) {
        let esocket
        try {
          log(`Attempting to auth ${hostPublicKey.toString('hex')}...`)
          esocket = await authConnection(socket, {
            publicKey: opts.publicKey,
            secretKey: opts.secretKey,
            hostPublicKey
          })
        } catch (e) {
          log.error('Failed to auth peer\n', e)
          continue
        }

        const address = socket.address().address
        log(`AUTHED WITH HOST! ${address}`)

        if (!timeout && !connected) {
          connected = true

          // close swarm when we're done with the socket
          esocket.once('close', () => {
            swarm.close()
            // TODO: unannounce to DHT
          })

          resolve(esocket)
        } else {
          esocket.destroy()
        }
      }

      connecting = false
    }

    // Wait for connections and attempt to auth with host
    const onConnection = async socket => {
      const address = socket.address().address
      log(`Remote swarm connection ${address}`)

      queue.push(socket)

      if (!connecting) {
        attemptConnect()
      }
    }
    swarm.on('connection', onConnection)

    timeoutId = setTimeout(() => {
      cleanup()
      timeout = true
      reject('Timeout connecting to swarm')
    }, NETWORK_TIMEOUT)
  })
}
