const EventEmitter = require('events').EventEmitter
const sodium = require('sodium-native')
const enc = require('sodium-encryption')
const lpstream = require('length-prefixed-stream')
const SimplePeer = require('simple-peer')

const SUCCESS = new Buffer('chat-auth-success')

function pub2auth(publicKey) {
    const publicAuthKey = new Buffer(sodium.crypto_box_PUBLICKEYBYTES);
    sodium.crypto_sign_ed25519_pk_to_curve25519(publicAuthKey, publicKey);
    return publicAuthKey
}

function secret2auth(secretKey) {
    const secretAuthKey = new Buffer(sodium.crypto_box_SECRETKEYBYTES);
    sodium.crypto_sign_ed25519_sk_to_curve25519(secretAuthKey, secretKey);
    return secretAuthKey
}

function seal(msg, publicKey) {
    var cipher = new Buffer(msg.length + sodium.crypto_box_SEALBYTES)
    sodium.crypto_box_seal(cipher, msg, publicKey)
    return cipher
}

function unseal(cipher, publicKey, secretKey) {
    if (cipher.length < sodium.crypto_box_SEALBYTES) return null
    var msg = new Buffer(cipher.length - sodium.crypto_box_SEALBYTES)
    if (!sodium.crypto_box_seal_open(msg, cipher, publicKey, secretKey)) return null
    return msg
}

/**
 * Socket wrapper to use encrypted keypair communication
 */
class EncryptedSocket extends EventEmitter {
    constructor(socket, publicKey, secretKey) {
        super()

        this.socket = socket
        this.publicKey = publicKey
        this.secretKey = secretKey

        this.publicAuthKey = pub2auth(publicKey)
        this.secretAuthKey = secret2auth(secretKey)

        this._onReceive = this._onReceive.bind(this)
    }

    /**
     * Connect to peer
     * @param {*} peerKey
     * @param {*} initiator Whether this connection is initiating
     */
    connect(peerKey) {
        if (peerKey) {
            this._authHost(peerKey)
        } else {
            this._authPeer()
        }
    }

    _setupSocket() {
        this._encode = lpstream.encode()
        this._decode = lpstream.decode()

        this._decode.on('data', this._onReceive)

        this._encode.pipe(this.socket)
        this.socket.pipe(this._decode)
    }

    _setupEncryptionKey(peerKey) {
        if (!this.sharedKey) {
            this.peerKey = peerKey
            this.peerAuthKey = pub2auth(peerKey)
            this.sharedKey = enc.scalarMultiplication(this.secretAuthKey, this.peerAuthKey)
            this._setupSocket()
        }
    }

    /** Auth connection to host */
    _authHost(hostKey) {
        const self = this

        /** 1. Send auth request with encrypted identity */
        function sendAuthRequest() {
            const box = seal(self.publicKey, self.peerAuthKey)

            // Send without shared key encryption until peer can derive it
            self.socket.write(box)

            self.once('data', receiveChallenge)
        }

        /** 2. Receive challenge to decrypt, send back decrypted */
        function receiveChallenge(challenge) {
            self.write(challenge)
            self.once('data', receiveAuthSuccess)
        }

        /** 3. Receive auth success */
        function receiveAuthSuccess(data) {
            if (data.equals(SUCCESS)) {
                self.emit('connection')
            }
        }

        this._setupEncryptionKey(hostKey)
        sendAuthRequest()
    }

    /** Auth connection to peer */
    _authPeer(socket, publicKey, secretKey) {
        const self = this

        let challenge

        /** 1. Learn peer identity */
        function receiveAuthRequest(data) {
            const buf = Buffer.from(data)
            const peerPublicKey = unseal(buf, self.publicAuthKey, self.secretAuthKey)

            if (!peerPublicKey) {
                self._error('Failed to unseal peer box')
                return
            }

            if (self.publicKey.equals(peerPublicKey)) {
                // console.error('Auth request key is the same as the host')
                // return
            }

            self._setupEncryptionKey(peerPublicKey)
            sendChallenge()
        }

        /** 2. Respond with challenge to decrypt */
        function sendChallenge() {
            challenge = enc.nonce()
            self.write(challenge)
            self.once('data', receiveChallengeVerification)
        }

        /** 3. Verify decrypted challenge */
        function receiveChallengeVerification(decryptedChallenge) {
            if (challenge.equals(decryptedChallenge)) {
                self.write(SUCCESS)
                self.emit('connection')
            } else {
                self._error('Failed to authenticate peer')
            }
        }

        this.socket.once('data', receiveAuthRequest)
    }

    write(data) {
        if (!this.sharedKey) {
            throw new Error(`EncryptedSocket failed to write. Missing 'sharedKey'`)
        }

        const nonce = enc.nonce()
        const box = enc.encrypt(data, nonce, this.sharedKey)

        const msg = new Buffer(nonce.length + box.length)
        nonce.copy(msg)
        box.copy(msg, nonce.length)

        this._encode.write(msg)
        console.debug(`Write ${msg.length} to ${this.peerKey.toString('hex')}`)
    }

    _onReceive(data) {
        if (!this.sharedKey) {
            throw new Error(`EncryptedSocket failed to receive. Missing 'sharedKey'`)
        }

        console.debug(`Received ${data.length} from ${this.peerKey.toString('hex')}`)

        const nonce = data.slice(0, sodium.crypto_box_NONCEBYTES)
        const box = data.slice(sodium.crypto_box_NONCEBYTES, data.length)

        const msg = enc.decrypt(box, nonce, this.sharedKey)

        if (!msg) {
            throw new Error('EncryptedSocket failed to decrypt received data.')
        }

        this.emit('data', msg)
    }

    destroy() {
        if (this.socket) {
            this.socket.destroy()
            this.socket = null
        }
    }

    _error(err) {
        this.destroy()
        this.emit('error', err)
    }
}

function writeJSON(stream, object) {
    const buf = new Buffer(JSON.stringify(object))
    stream.write(buf)
}

function readJSON(data, cb) {
    let string = data.toString()
    try {
        const json = JSON.parse(string)
        cb(json);
    } catch (e) {
        throw e;
    }
}

function signalPeer(socket, opts) {
    return new Promise((resolve, reject) => {
        const peer = SimplePeer(opts)
        peer.once('error', reject)

        const writeSignal = answer => writeJSON(socket, answer)
        const readSignal = data => readJSON(data, offer => peer.signal(offer))

        peer.on('signal', writeSignal)
        socket.on('data', readSignal)

        peer.once('connect', () => {
            peer.removeListener('signal', writeSignal)
            socket.removeListener('data', readSignal)
            resolve(peer)
        })
    })
}

module.exports = {
    EncryptedSocket,
    signalPeer
}
