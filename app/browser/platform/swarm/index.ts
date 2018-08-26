import { ipcMain } from 'electron'
import { PRODUCT_NAME } from 'constants/app'

import log from 'browser/log'
import { ILobbyOptions } from 'renderer/platform/types'

import * as swarmDefaults from 'dat-swarm-defaults'
import * as swarm from 'swarm-peer-server'

import { signalRenderer } from 'browser/platform/swarm/signal'
import { WEBSOCKET_PORT_DEFAULT } from 'constants/network'
import * as username from 'username'
import { WebSocketServer } from './websocket'
import { initIdentity, getKeyPair } from './identity'

function checkNativeDeps() {
  try {
    require('utp-native')
  } catch (e) {
    log.error('Failed to load utp-native')
    log.error(e)
  }
}

let prevLobbyConnectTime = 0
const updateConnectTime = () => (prevLobbyConnectTime = Date.now())
const isPrevConnectTime = (time: number) => prevLobbyConnectTime === time

ipcMain.on('platform-swarm-init', async (event: Electron.Event) => {
  let id
  let name = (await username()) || PRODUCT_NAME
  try {
    id = await initIdentity()
  } catch (e) {
    id = ''
    log.error('Failed to initialize swarm identity')
  } finally {
    event.returnValue = {
      id,
      username: name
    }
  }
})

let swarmServer: any
let wsServer: WebSocketServer | null

ipcMain.on('platform-create-lobby', (event: Electron.Event, ipcId: number, opts: ILobbyOptions) => {
  const { sender } = event

  updateConnectTime()

  if (opts.p2p) {
    checkNativeDeps()

    if (swarmServer) {
      log.error('Attempt to create new swarm server without closing existing server.')
      swarmServer.close()
      swarmServer = null
    }

    swarmServer = swarm.listen(
      {
        ...swarmDefaults({ hash: false }),
        ...getKeyPair()
      },
      async (esocket, peerKey) => {
        const keyStr = peerKey.toString('hex')
        log(`New swarm connection from ${keyStr}`)

        try {
          log(`${keyStr} signaling renderer`)
          await signalRenderer(esocket, peerKey)
          log(`${keyStr} connected to renderer`)
        } catch (e) {
          log.error(`Failed to connect to peer ${keyStr}:`, e)
        } finally {
          esocket.destroy()
        }
      }
    )

    log('Swarm server now listening...')
  }

  if (opts.websocket) {
    if (wsServer) {
      log.error('Attempt to create new WebSocket without closing existing server.')
      wsServer.close()
      wsServer = null
    }

    wsServer = new WebSocketServer({
      port: WEBSOCKET_PORT_DEFAULT,
      ...getKeyPair()
    })
  }

  event.sender.send('platform-create-lobby-result', ipcId, true)
})

const shutdownServers = () => {
  if (swarmServer) {
    swarmServer.close()
    swarmServer = null
    log('Closed swarm server')
  }

  if (wsServer) {
    wsServer.close()
    wsServer = null
    log('Closed WebSocket server')
  }
}

ipcMain.on('platform-leave-lobby', (event: Electron.Event) => {
  shutdownServers()
})

ipcMain.on(
  'platform-join-lobby',
  async (event: Electron.Event, ipcId: number, serverId: string) => {
    checkNativeDeps()
    shutdownServers()

    let connectTime = updateConnectTime()

    const hostPublicKey = Buffer.from(serverId, 'hex')
    let conn

    try {
      conn = await swarm.connect({
        ...swarmDefaults({ hash: false }),
        ...getKeyPair(),
        hostPublicKey
      })
    } catch (e) {
      log.error(`Join lobby error`, e)
    }

    // HACK: handle join cancellation and retry - only consider most recent result
    const shouldSignal = isPrevConnectTime(connectTime)
    let success = false

    if (shouldSignal && conn) {
      try {
        await signalRenderer(conn.socket, hostPublicKey)
        success = true
        log.debug(`Finished signaling connection to host ${serverId}`)
      } catch (e) {
        log.error(`Failed to connect to peer ${serverId}\n`, e)
      }
    }

    if (conn) {
      conn.socket.destroy()
    }

    event.sender.send('platform-join-lobby-result', ipcId, success)
  }
)
