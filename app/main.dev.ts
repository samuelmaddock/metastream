/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserWindow, globalShortcut, protocol } from 'electron'
import os from 'os'
import packageJson from 'package.json'

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')()
  const path = require('path')
  const p = path.join(__dirname, '..', 'app', 'node_modules')
  require('module').globalPaths.push(p)
}

if (process.env.NODE_ENV === 'development') {
  // Update version before running any code
  // Fixes Brave overriding version
  ;(app as any).setVersion(packageJson.version)
}

import 'browser/net'
import { register as registerLocalShortcut } from 'electron-localshortcut'
import { join, dirname } from 'path'

import { sleep } from 'utils/async'
import MenuBuilder from './browser/menu'
import * as protocols from './browser/protocols'
import { initExtensions } from 'browser/extensions'
import { initUpdater } from 'browser/update'
import log from 'browser/log'

import './browser/fetch'

app.commandLine.appendSwitch('enable-blink-features', 'CSSBackdropFilter')
app.commandLine.appendSwitch('no-user-gesture-required')

const fixUserDataPath = () => {
  const BRAVE_STR = 'brave'
  let userDataPath = app.getPath('userData')

  if (userDataPath.endsWith(BRAVE_STR)) {
    userDataPath = userDataPath.substring(0, userDataPath.length - BRAVE_STR.length)
    userDataPath = `${userDataPath}${packageJson.productName}`
    app.setPath('userData', userDataPath)
  }
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support')
  sourceMapSupport.install()
}

/* Commented out as unused and LGPL licensed code
const installExtensions = async () => {
  const installer = require('electron-devtools-installer')
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS']

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(log)
}
*/

fixUserDataPath()
protocols.init()

// Platform backend
import 'browser/platform/swarm'
import 'browser/license'
import 'browser/media-router'

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/** Relays global shortcuts to renderer windows via IPC */
const registerMediaShortcuts = () => {
  // TODO: why the fuck do these block commands elsewhere?
  const globalCommands = [['medianexttrack', 'media:next'], ['mediaplaypause', 'media:playpause']]

  const ipcShortcut = (shortcut: string) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('command', shortcut)
    })
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
    ['Cmd+Left', 'window:history-prev'],
    ['Alt+Right', 'window:history-next'],
    ['Cmd+Right', 'window:history-next'],
    ['Cmd+Right', 'window:history-next']
    // ['Space', 'media:playpause'],
  ]

  localCommands.forEach(cmd => {
    BrowserWindow.getAllWindows().forEach(win => {
      registerLocalShortcut(win, cmd[0], () => {
        win.webContents.send('command', cmd[1])
      })
    })
  })
}

const setupWindow = () => {
  let win: BrowserWindow | null = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    frame: false,
    titleBarStyle: 'hidden'
  })

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
      win = null
    }
  })

  const menuBuilder = new MenuBuilder(win)
  menuBuilder.buildMenu()

  return win
}

app.on('web-contents-created', (event, webContents) => {
  // Prevent HTML5 fullscreen api from fullscreening the window
  webContents.on('will-enter-html-full-screen' as any, event => {
    event.preventDefault()
  })
})

app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    // await installExtensions();
  }

  initUpdater()

  let numWindows = 1

  // Allow multiple windows for local testing
  if (process.env.NODE_ENV === 'development') {
    numWindows = parseInt(process.env.NUM_WINDOWS || '1', 10) || 1
    numWindows = Math.min(Math.max(numWindows, 1), 4)
  }

  for (let i = 0; i < numWindows; i++) {
    setupWindow()
  }

  registerMediaShortcuts()
})
