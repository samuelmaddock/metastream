import * as username from 'username'
import * as swarmDefaults from 'dat-swarm-defaults'
import * as swarm from 'swarm-peer-server'

import log from 'browser/log'
import { PRODUCT_NAME } from 'constants/app'
import { WEBSOCKET_PORT_DEFAULT } from 'constants/network'

import { signalRenderer } from 'browser/platform/swarm/signal'
import { initIdentity } from './identity'
import { WebSocketServer } from './websocket'
import { ILobbyOptions } from 'renderer/platform/types'
import { KeyPair } from './crypto'

export class SwarmClient {
  keyPair?: KeyPair

  private swarmServer: any
  private wsServer: WebSocketServer | null = null

  private prevLobbyConnectTime = 0

  private updateConnectTime = () => (this.prevLobbyConnectTime = Date.now())
  private isPrevConnectTime = (time: number) => this.prevLobbyConnectTime === time

  constructor(private webContents: Electron.WebContents) {}

  async initIdentity(primaryIdentity: boolean) {
    let name = (await username()) || PRODUCT_NAME

    try {
      this.keyPair = await initIdentity(!primaryIdentity)
    } catch (e) {
      log.error('Failed to initialize Swarm identity')
      log.error(e)
    }

    const id = this.keyPair ? this.keyPair.publicKey.toString('hex') : ''
    log(`Init swarm ID: ${id}`)

    return { id, username: name }
  }

  private disconnect() {
    if (this.swarmServer) {
      this.swarmServer.close()
      this.swarmServer = null
      log('Closed swarm server')
    }

    if (this.wsServer) {
      this.wsServer.close()
      this.wsServer = null
      log('Closed WebSocket server')
    }
  }

  createLobby(opts: ILobbyOptions) {
    if (!this.keyPair) {
      log(`Attempt to create lobby with no keypair`, opts)
      return
    }

    this.updateConnectTime()

    if (opts.p2p) {
      if (this.swarmServer) {
        log.error('Attempt to create new swarm server without closing existing server.')
        this.swarmServer.close()
        this.swarmServer = null
      }

      swarm
        .listen(
          {
            ...swarmDefaults({ hash: false }),
            ...this.keyPair
          },
          async (esocket, peerKey) => {
            const keyStr = peerKey.toString('hex')
            log(`New swarm connection from ${keyStr}`)

            try {
              log(`${keyStr} signaling renderer`)
              await signalRenderer(this.webContents, esocket, peerKey)
              log(`${keyStr} connected to renderer`)
            } catch (e) {
              log.error(`Failed to connect to peer ${keyStr}:`, e)
            } finally {
              esocket.destroy()
            }
          }
        )
        .then((swarmServer: any) => {
          this.swarmServer = swarmServer
        })

      log('Swarm server now listening...')
    }

    if (opts.websocket) {
      if (this.wsServer) {
        log.error('Attempt to create new WebSocket without closing existing server.')
        this.wsServer.close()
        this.wsServer = null
      }

      this.wsServer = new WebSocketServer({
        webContents: this.webContents,
        port: WEBSOCKET_PORT_DEFAULT,
        ...this.keyPair!
      })
    }
  }

  async joinLobby(serverId: string) {
    this.disconnect()

    let connectTime = this.updateConnectTime()

    const hostPublicKey = Buffer.from(serverId, 'hex')
    let conn

    try {
      conn = await swarm.connect({
        ...swarmDefaults({ hash: false }),
        ...this.keyPair,
        hostPublicKey
      })
    } catch (e) {
      log.error(`Join lobby error`, e)
    }

    // HACK: handle join cancellation and retry - only consider most recent result
    const shouldSignal = this.isPrevConnectTime(connectTime)
    let success = false

    if (shouldSignal && conn) {
      try {
        await signalRenderer(this.webContents, conn.socket, hostPublicKey)
        success = true
        log.debug(`Finished signaling connection to host ${serverId}`)
      } catch (e) {
        log.error(`Failed to connect to peer ${serverId}\n`, e)
      }
    }

    if (conn) {
      conn.socket.destroy()
    }

    return success
  }

  leaveLobby() {
    this.disconnect()
  }
}
