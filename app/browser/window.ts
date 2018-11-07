import { app, BrowserWindow, globalShortcut } from 'electron'
import { register as registerLocalShortcut } from 'electron-localshortcut'

import MenuBuilder from './menu'
import { initExtensions } from 'browser/extensions'

let mainWindow: BrowserWindow | null = null

export const getMainWindow = () => {
  if (mainWindow) {
    return mainWindow
  } else {
    throw new Error('getMainWindow called prior to app initializing')
  }
}

export const setupWindow = () => {
  let win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    frame: false,
    titleBarStyle: 'hidden'
  })

  const isMainWindow = !mainWindow
  if (isMainWindow) mainWindow = win

  win.loadURL(`chrome://brave/${__dirname}/app.html`)

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  win.webContents.on('did-finish-load', () => {
    if (!win) {
      throw new Error('"win" is not defined')
    }
    initExtensions()
    win.show()
    win.focus()
  })

  win.on('closed', () => {
    if (win) {
      win.removeAllListeners()
      if (isMainWindow) {
        mainWindow = null
      }
    }
  })

  const menuBuilder = new MenuBuilder(win)
  menuBuilder.buildMenu()

  if (isMainWindow) {
    registerMediaShortcuts()
  }
}

/** Relays global shortcuts to renderer windows via IPC */
const registerMediaShortcuts = () => {
  const win = getMainWindow()
  const globalCommands = [['medianexttrack', 'media:next'], ['mediaplaypause', 'media:playpause']]

  const ipcShortcut = (shortcut: string) => {
    win.webContents.send('command', shortcut)
  }

  globalCommands.forEach(cmd => {
    globalShortcut.register(cmd[0], ipcShortcut.bind(null, cmd[1]))
  })

  const localCommands = [
    ['CmdOrCtrl+T', 'window:new-tab'],
    ['CmdOrCtrl+N', 'window:new-tab'],
    ['CmdOrCtrl+L', 'window:focus-url'],
    ['CmdOrCtrl+W', 'window:close'],
    ['Alt+Left', 'window:history-prev'],
    ['Alt+Right', 'window:history-next']
    // ['Space', 'media:playpause'],
  ]

  localCommands.forEach(cmd => {
    registerLocalShortcut(win, cmd[0], () => {
      win.webContents.send('command', cmd[1])
    })
  })
}
