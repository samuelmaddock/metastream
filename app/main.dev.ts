// Error handling
import 'browser/error'

import { app } from 'electron'
import { PRODUCT_NAME, VERSION } from 'constants/app'

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')()
  const path = require('path')
  const p = path.join(__dirname, '..', 'app', 'node_modules')
  require('module').globalPaths.push(p)
}

if (process.env.NODE_ENV === 'development') {
  // Update version before running any code
  // Fixes Brave overriding version
  ;(app as any).setVersion(VERSION)
}

import 'browser/net'
import * as protocols from './browser/protocols'
import { initUpdater } from 'browser/update'
import 'browser/fetch'
import { setupWindow, getMainWindow } from 'browser/window'

app.commandLine.appendSwitch('enable-blink-features', 'CSSBackdropFilter')
app.commandLine.appendSwitch('no-user-gesture-required')

const fixUserDataPath = () => {
  const BRAVE_STR = 'brave'
  let userDataPath = app.getPath('userData')

  if (userDataPath.endsWith(BRAVE_STR)) {
    userDataPath = userDataPath.substring(0, userDataPath.length - BRAVE_STR.length)
    userDataPath = `${userDataPath}${PRODUCT_NAME}`

    if (process.env.NODE_ENV === 'development') {
      userDataPath += 'Dev'
    }

    app.setPath('userData', userDataPath)
  }
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support')
  sourceMapSupport.install()
}

fixUserDataPath()
protocols.init()

// Platform backend
import 'browser/platform/swarm'
import 'browser/media-router'

function main() {
  const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
    const win = getMainWindow()
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  if (shouldQuit) {
    app.quit()
    return
  }

  app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('web-contents-created', (event, webContents) => {
    // Prevent HTML5 fullscreen api from fullscreening the window
    webContents.on('will-enter-html-full-screen' as any, event => {
      event.preventDefault()
    })
  })

  app.on('ready', () => {
    initUpdater()
    setupWindow()
  })
}

main()
