import { BrowserWindow, ipcMain, ipcRenderer } from 'electron'
import { EncryptedSocket } from './socket'
import { Key } from './crypto'
import { SignalData } from 'renderer/network/rtc'
import { NETWORK_TIMEOUT } from 'constants/network'
import log from 'browser/log';

/** Relay signal data to renderer process */
export async function signalRenderer(socket: EncryptedSocket, peerKey: Key): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const keyStr = peerKey.toString('hex')

    // TODO: better way to get the window we want
    const win = BrowserWindow.getFocusedWindow()
    const { webContents } = win

    const relayReadSignal = (data: Buffer) => {
      readJSON(data, (offer: SignalData) => {
        webContents.send('rtc-peer-signal', keyStr, offer)
      })
    }
    socket.on('data', relayReadSignal)

    const relayWriteSignal = (event: Electron.Event, key: string, signal: SignalData) => {
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
        reject()
      }
    }

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      ipcMain.removeListener('rtc-peer-connect', onPeerConnect)
      ipcMain.removeListener('rtc-peer-error', onPeerError)
      ipcMain.removeListener('rtc-peer-signal', relayWriteSignal)
      // TODO: unannounce DHT peer
    }

    ipcMain.once('rtc-peer-connect', onPeerConnect)
    ipcMain.once('rtc-peer-error', onPeerError)

    webContents.send('rtc-peer-init', keyStr)

    timeoutId = (setTimeout(() => {
      webContents.send('rtc-peer-timeout', keyStr);
      cleanup()
      reject()
    }, NETWORK_TIMEOUT) as any) as number
  })
}

function writeJSON(stream: any, object: SignalData) {
  const buf = new Buffer(JSON.stringify(object))
  stream.write(buf)
}

function readJSON(data: Buffer, cb: (data: SignalData) => void) {
  let string = data.toString()
  let json
  try {
    json = JSON.parse(string)
  } catch (e) {
    throw e
  }
  cb(json)
}

/*
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
*/
