import { ipcMain } from 'electron'
import log from './log'

// const listenerMap = new Map<number, Electron.WebContents>()
const listeners = new Set<Electron.WebContents>()

interface IMediaEvent {
  type: string
  payload: any
}

ipcMain.on('media-register-listener', function({ sender }: Electron.Event, href: string) {
  log.info(`MEDIA REGISTER ${href}`)
  if (sender && !listeners.has(sender)) {
    listeners.add(sender)
  }
})

ipcMain.on('media-action', (event: Electron.Event, mediaEvent: IMediaEvent) => {
  listeners.forEach(listener => listener.send('media-action', mediaEvent))
})

ipcMain.on('media-cleanup', (event: Electron.Event) => {
  listeners.clear()
})
