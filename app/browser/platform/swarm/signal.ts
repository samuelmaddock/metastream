import { BrowserWindow, ipcMain, ipcRenderer } from 'electron'
import { EncryptedSocket } from './socket'
import { Key } from './crypto'
import { SignalData } from 'renderer/network/rtc'

/** Relay signal data to renderer process */
export async function signalRenderer(socket: EncryptedSocket, peerKey: Key): Promise<boolean> {
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
    if (event.sender === webContents && key === keyStr) {
      writeJSON(socket, signal)
    }
  }
  ipcMain.on('rtc-peer-signal', relayWriteSignal)

  const cleanup = () => {
    ipcMain.removeListener('rtc-peer-signal', relayWriteSignal)
    socket.destroy()
    // TODO: unannounce DHT peer
  }

  return new Promise<boolean>((resolve, reject) => {
    ipcMain.once('rtc-peer-connect', (event: Electron.Event, key: string) => {
      if (event.sender === webContents && key === keyStr) {
        cleanup()
        resolve(true)
      }
    })

    ipcMain.once('rtc-peer-error', (event: Electron.Event, key: string) => {
      if (event.sender === webContents && key === keyStr) {
        cleanup()
        reject()
      }
    })

    webContents.send('rtc-peer-init', keyStr)
  })
}

function writeJSON(stream: any, object: SignalData) {
  const buf = new Buffer(JSON.stringify(object))
  stream.write(buf)
}

function readJSON(data: Buffer, cb: (data: SignalData) => void) {
  let string = data.toString()
  try {
    const json = JSON.parse(string)
    cb(json)
  } catch (e) {
    throw e
  }
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
