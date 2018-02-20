import { BrowserWindow, ipcMain, ipcRenderer } from 'electron'
import { Key } from './crypto'
import { SignalData } from 'renderer/network/rtc'
import { NETWORK_TIMEOUT } from 'constants/network'
import log from 'browser/log'
import { SimplePeerData } from 'simple-peer'
import { EncryptedSocket } from 'swarm-peer-server'

/** Relay signal data to renderer process */
export async function signalRenderer(socket: EncryptedSocket, peerKey: Key): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const keyStr = peerKey.toString('hex')

    // TODO: better way to get the window we want
    const win = BrowserWindow.getAllWindows()[0]
    const { webContents } = win

    const relayReadSignal = (data: Buffer) => {
      log.debug(`SIGNAL read [${data.length}] ${keyStr}`)
      const signal = readJSON(data)
      webContents.send('rtc-peer-signal', keyStr, signal)
    }
    socket.on('data', relayReadSignal)

    const relayWriteSignal = (event: Electron.Event, key: string, signal: SignalData) => {
      log.debug(`SIGNAL write ${keyStr}`)
      if (event.sender.id === webContents.id && key === keyStr) {
        writeJSON(socket, signal)
      }
    }
    ipcMain.on('rtc-peer-signal', relayWriteSignal)

    let timeoutId: number | null

    const onPeerConnect = (event: Electron.Event, key: string) => {
      if (event.sender.id === webContents.id && key === keyStr) {
        cleanup()
        resolve()
      }
    }

    const onPeerError = (event: Electron.Event, key: string) => {
      if (event.sender.id === webContents.id && key === keyStr) {
        cleanup()
        reject(`Peer error`)
      }
    }

    const setupTimeout = (delay: number) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = (setTimeout(() => {
        cleanup()
        webContents.send('rtc-peer-timeout', keyStr)
        reject(`Signalling timeout`)
      }, delay) as any) as number
    }

    const onSocketClose = () => {
      log.debug(`Signaling connection closed`)

      // Give small delay to allow time for connect IPC
      setupTimeout(1000)
    }
    socket.once('close', onSocketClose)

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      ipcMain.removeListener('rtc-peer-connect', onPeerConnect)
      ipcMain.removeListener('rtc-peer-error', onPeerError)
      ipcMain.removeListener('rtc-peer-signal', relayWriteSignal)
      socket.removeListener('close', onSocketClose)
      socket.removeListener('data', relayReadSignal)
    }

    ipcMain.once('rtc-peer-connect', onPeerConnect)
    ipcMain.once('rtc-peer-error', onPeerError)

    log(`INITING SIGNAL FOR ${keyStr}`)
    webContents.send('rtc-peer-init', keyStr)

    setupTimeout(NETWORK_TIMEOUT)
  })
}

function writeJSON(stream: any, object: SignalData) {
  const buf = new Buffer(JSON.stringify(object))
  stream.write(buf)
}

function readJSON(data: Buffer): SimplePeerData {
  let string = data.toString()
  let json
  try {
    json = JSON.parse(string)
  } catch (e) {
    throw e
  }
  return json
}
