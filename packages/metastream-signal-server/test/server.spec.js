const EventEmitter = require('events')
const sodium = require('libsodium-wrappers')
const wrtc = require('wrtc')
const { WebSocket, Server } = require('mock-socket')

const { MessageType } = require('../lib/types')
const { SignalServer } = require('../lib')
const { default: _createClient } = require('../lib/client')
const { waitEvent } = require('../lib/util')

Server.prototype.off = function(type, callback) {
  this.removeEventListener(type, callback)
}
WebSocket.prototype.once = function(type, callback) {
  this.on(type, function(...args) {
    callback(...args)
    this.removeEventListener(type, callback)
  })
}

const fakeUrl = 'ws://mockhost'
const peerOpts = { wrtc }
const getKeypair = seed => sodium.crypto_box_seed_keypair(sodium.from_string(seed.padEnd(32)))
const inactiveTimeout = 200

describe('signal server', () => {
  let server
  let wsServer

  let clients = []
  let peers = []
  const createClient = async (...args) => {
    const client = await _createClient(...args)
    client.on('peer', peer => peers.push(peer))
    clients.push(client)
    return client
  }

  beforeAll(() => sodium.ready)

  beforeEach(() => {
    wsServer = new Server(fakeUrl)
    server = new SignalServer({ wsServer, inactiveTimeout })
  })

  afterEach(() => {
    peers.forEach(peer => peer.destroy())
    peers = []
    clients.forEach(client => client.close())
    clients = []
    server.close()
    wsServer.stop()
  })

  describe('create rooms', () => {
    it('one', async () => {
      const client = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      await client.createRoom(getKeypair('a'))
    })

    it('two', async () => {
      const clientA = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      await clientA.createRoom(getKeypair('a'))
      const clientB = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      await clientB.createRoom(getKeypair('b'))
    })

    it('same key overrides existing', async () => {
      const keypair = getKeypair('a')
      const clientA = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      await clientA.createRoom(keypair)
      const clientB = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      await clientB.createRoom(keypair)
    })
  })

  describe('join room', () => {
    it('client joins room', async () => {
      const clientA = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      const clientAKeypair = getKeypair('a')
      await clientA.createRoom(clientAKeypair)

      const clientB = await createClient({ peerOpts, server: fakeUrl, WebSocket })

      const peerPromises = Promise.all([
        waitEvent(clientA, 'peer'),
        waitEvent(clientB, 'peer')
      ])

      await clientB.joinRoom(sodium.to_hex(clientAKeypair.publicKey))

      await peerPromises
    })

    it('multiple clients join room', async () => {
      let peerPromise

      const clientA = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      const clientAKeypair = getKeypair('a')
      await clientA.createRoom(clientAKeypair)

      const clientB = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      peerPromise = waitEvent(clientB, 'peer')
      await clientB.joinRoom(sodium.to_hex(clientAKeypair.publicKey))
      await peerPromise

      const clientC = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      peerPromise = waitEvent(clientC, 'peer')
      await clientC.joinRoom(sodium.to_hex(clientAKeypair.publicKey))
      await peerPromise
    })
  })

  describe('inactivity', () => {
    it('closes inactive room after created timeout', async () => {
      const clientA = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      await clientA.createRoom(getKeypair('a'))

      await new Promise(resolve => setTimeout(resolve, inactiveTimeout))

      expect(server.clients.size).toEqual(1)
      server.checkInactive()
      expect(server.clients.size).toEqual(0)
    })
    it('closes inactive room after lastModified timeout', async () => {
      const clientA = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      const clientAKeypair = getKeypair('a')
      await clientA.createRoom(clientAKeypair)

      const clientB = await createClient({ peerOpts, server: fakeUrl, WebSocket })
      await clientB.joinRoom(sodium.to_hex(clientAKeypair.publicKey))

      await new Promise(resolve => setTimeout(resolve, inactiveTimeout))

      expect(server.clients.size).toEqual(2)
      server.checkInactive()
      expect(server.clients.size).toEqual(0)
    })
  })
})
