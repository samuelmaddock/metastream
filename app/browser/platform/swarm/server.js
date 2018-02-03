const sodium = require('sodium-universal')
const discoverySwarm = require('discovery-swarm')
const swarmDefaults = require('dat-swarm-defaults')

const { EncryptedSocket, signalPeer } = require('./network')

const FRIENDSWARM = new Buffer('swarm3')

const TIMEOUT_DURATION = 5000

// +1 from Dat protocol default to reduce conflict
const DEFAULT_PORT = 3283

const SWARM_OPTS = {
    hash: false
}

// Get discovery key from original key
function getDiscoveryKey(tree) {
    var digest = new Buffer(32)
    sodium.crypto_generichash(digest, FRIENDSWARM, tree)
    // console.debug(`FRIENDDISC digest=${digest.toString('hex')}, tree=${tree.toString('hex')}`)
    return digest
}

function createSwarm(opts) {
    const swarm = discoverySwarm(swarmDefaults(SWARM_OPTS))
    swarm.listen(DEFAULT_PORT)
    swarm.join(opts.id, { announce: opts.announce ? opts.announce : true })

    swarm.on('error', function(){
        swarm.listen(0)
    })

    return swarm
}

async function authConnection(socket, opts) {
    return new Promise((resolve, reject) => {
        const esocket = new EncryptedSocket(socket, opts.publicKey, opts.secretKey)

        esocket.once('connection', () => { resolve(esocket) })
        esocket.once('error', () => { reject() })

        esocket.connect(opts.hostPublicKey)
    })
}

function listen(opts, connectionHandler) {
    const discoveryKey = getDiscoveryKey(opts.publicKey)
    const swarm = createSwarm({id: discoveryKey})

    // Wait for connections to perform auth handshake with
    swarm.on('connection', async socket => {
        console.log('Local swarm connection', socket)

        const esocket = await authConnection(socket, {
            publicKey: opts.publicKey,
            secretKey: opts.secretKey
        })

        console.log(`AUTHED WITH PEER! ${socket.address().address}`)

        const peer = await signalPeer(esocket)

        console.log('PEER PEER', peer)
        esocket.destroy()

        connectionHandler(peer, esocket.peerKey)
    })

    return swarm
}

function connect(opts, cb) {
    let timeoutId, timeout
    const hostPublicKey = opts.hostPublicKey
    const discoveryKey = getDiscoveryKey(hostPublicKey)
    const swarm = createSwarm({id: discoveryKey})

    // Wait for connections and attempt to auth with host
    swarm.on('connection', async socket => {
        console.log('Remote swarm connection', socket)

        const esocket = await authConnection(socket, {
            publicKey: opts.publicKey,
            secretKey: opts.secretKey,
            hostPublicKey
        })

        console.log(`AUTHED WITH HOST! ${socket.address().address}`)
        const peer = await signalPeer(esocket, {initiator: true})

        console.info('HOST PEER', peer)
        esocket.destroy()
        swarm.close()

        if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
        }

        if (!timeout) {
            cb(null, peer, hostPublicKey)
        }
    })

    timeoutId = setTimeout(() => {
        swarm.close()
        timeoutId = null
        timeout = true
        cb('Timeout connecting to swarm')
    }, TIMEOUT_DURATION)

    return swarm
}

module.exports = {
    listen,
    connect
}
