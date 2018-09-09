import fs from 'fs-extra'
import path from 'path'
import { app, session, componentUpdater, ipcMain, BrowserWindow } from 'electron'
import * as settings from 'electron-settings'
import log from './log'
import * as widevine from 'constants/widevine'
import { fileUrl } from 'utils/appUrl'
import * as walkdir from 'walkdir'

const extVerRegex = /^[\d._]+$/
const isExtVersion = (dirName: string) => !!extVerRegex.exec(dirName)
const getExtensionsPath = () => path.join(app.getPath('userData'), '/Extensions')
const getMediaExtensionsPath = () => {
  const extDir = process.env.NODE_ENV === 'production' ? '../extensions' : '/extensions'
  const extRoot = path.normalize(path.join(__dirname, extDir))
  return extRoot
}
const isVendorExtension = (info: any) => info.base_path.includes(getExtensionsPath())

let initialized = false
const activeExtensions = new Set<string>()
const extensionInfo = new Map<string, any>()

const getSettingsList = () => {
  const list = settings.get('extensions.list')
  return Array.isArray(list) ? list : []
}
const SETTINGS_EXT_LIST = 'extensions.list'

const loadExtension = (session: Electron.session, extId: string, extPath: string) => {
  session.extensions.load(extPath, {}, 'unpacked')
}

const enableExtension = (session: Electron.session, extId: string) => {
  session.extensions.enable(extId)
  activeExtensions.add(extId)
  settings.set(SETTINGS_EXT_LIST, Array.from(activeExtensions))
}

const disableExtension = (session: Electron.session, extId: string) => {
  session.extensions.disable(extId)
  activeExtensions.delete(extId)
  settings.set(SETTINGS_EXT_LIST, Array.from(activeExtensions))
}

const getActiveExtensions = () => Array.from(activeExtensions)
const getSession = () => session.fromPartition('persist:mediaplayer', { cache: true })

const APP_EXTENSIONS = new Set([
  'dfmpchfgfkhhkigicpheeacmlkbomihe' /*enhanced-media-viewer*/,
  'hkidiceoepkfhoiheiohiaclkahjecdn' /*media-remote*/
])

export function initExtensions() {
  if (!initialized) {
    if (settings.has(SETTINGS_EXT_LIST)) {
      getSettingsList().forEach((extId: any) => activeExtensions.add(extId))
    } else {
      settings.set(SETTINGS_EXT_LIST, [])
    }

    initProcessListeners()
    loadComponents()
  }

  const mediaSession = getSession()
  loadMediaExtensions(mediaSession)
  loadVendorExtensions(mediaSession)
  initIpc(mediaSession)

  initialized = true
}

function initProcessListeners() {
  process.on('extension-ready' as any, (info: any) => {
    info.file_path = fileUrl(info.base_path)
    extensionInfo.set(info.id, info)

    log.info(
      `Extension ready\n\tid=${info.id}\n\tbase_path=${
        info.base_path
      }\n\text_path=${getExtensionsPath()}\n\tisVendor=${isVendorExtension(info)}`,
      info
    )

    if (isVendorExtension(info) && !activeExtensions.has(info.id)) {
      disableExtension(getSession(), info.id)
    }
  })

  process.on(
    'chrome-browser-action-popup' as any,
    (
      extensionId: string,
      tabId: string,
      name: string,
      popup: string,
      props: { [key: string]: any }
    ) => {
      let nodeProps = {
        left: props.x,
        top: props.y + 20,
        src: popup
      }

      let win = BrowserWindow.getFocusedWindow()
      if (!win) {
        return
      }

      log.debug(`[Extension] Show popup`, extensionId, popup, nodeProps)
      win.webContents.send('extensions-show-popup', extensionId, popup, nodeProps)
    }
  )
}

type ExtensionStat = {
  id: string
  dir: string
}

function findExtensionsInDir(dir: string) {
  return new Promise<ExtensionStat[]>(resolve => {
    const exts: ExtensionStat[] = []

    const emitter = walkdir(dir, { max_depth: 3 }, function(pathname: string, stat: fs.Stats) {
      if (path.basename(pathname) !== 'manifest.json') return

      const relPath = path.relative(dir, pathname)
      const id = relPath.split(path.sep).shift()!

      exts.push({
        id: id,
        dir: path.dirname(pathname)
      })
    })

    emitter.once('end', () => resolve(exts))
  })
}

async function readExtensionsInDir(
  dir: string,
  cb: (err: Error | null, extId?: string, dir?: string) => void
) {
  const extensions = await findExtensionsInDir(dir)
  extensions.forEach(ext => {
    cb(null, ext.id, ext.dir)
  })
}

function loadVendorExtensions(session: Electron.Session) {
  const extDir = getExtensionsPath()

  if (!fs.existsSync(extDir)) {
    fs.mkdirSync(extDir)
  }

  readExtensionsInDir(extDir, (err, extId, dir) => {
    if (err) {
      log.debug(`Skipping uninstalled extension ${extId}`)
      return
    }

    log.debug(`Loading extension ${extId}`)
    loadExtension(session, extId!, dir!)

    if (activeExtensions.has(extId!)) {
      enableExtension(session, extId!)
    }
  })
}

function loadMediaExtensions(session: Electron.Session) {
  readExtensionsInDir(getMediaExtensionsPath(), (err, extId, dir) => {
    if (err) {
      log.error(err)
      return
    }

    log.debug(`Loading extension ${extId}`)
    loadExtension(session, extId!, dir!)
    enableExtension(session, extId!)
  })
}

const registerComponent = (extensionId: string, publicKeyString: string) => {
  if (typeof publicKeyString !== 'undefined') {
    componentUpdater.registerComponent(extensionId, publicKeyString)
  } else {
    componentUpdater.registerComponent(extensionId)
  }
}

function loadComponents() {
  componentUpdater.on('component-checking-for-updates', (e: any, cid: string) => {
    log.debug(`[Component] Checking for update ${cid}`)
  })
  componentUpdater.on('component-update-found', (e: any, cid: string) => {
    log.debug(`[Component] Update found ${cid}`)
  })
  componentUpdater.on('component-update-ready', (e: any, cid: string) => {
    log.debug(`[Component] Update ready ${cid}`)
  })
  componentUpdater.on('component-update-updated', (e: any, cid: string, version: string) => {
    log.debug(`[Component] Updated ${cid} to ${version}`)
  })
  componentUpdater.on('component-ready', (e: any, cid: string, extensionPath: string) => {
    log.debug(`[Component] ${cid} ready in ${extensionPath}`)
  })
  componentUpdater.on('component-not-updated', (e: any, cid: string) => {
    log.debug(`[Component] ${cid} not updated`)
  })
  componentUpdater.on('component-registered', (e: any, cid: string) => {
    log.debug(`[Component] ${cid} registered`)
    componentUpdater.checkNow(cid)
  })

  log.debug(`Registering widevine component ${widevine.widevineComponentId}`)
  registerComponent(widevine.widevineComponentId, widevine.widevineComponentPublicKey)
}

/* ----------------------------------------
  IPC
---------------------------------------- */

function sendStatus(sender: Electron.WebContents) {
  const list = Array.from(extensionInfo.keys())
    .filter(extId => {
      // only send status for vendor extensions
      return isVendorExtension(extensionInfo.get(extId))
    })
    .map(extId => {
      let status = {
        id: extId,
        enabled: activeExtensions.has(extId)
      }

      const info = extensionInfo.get(extId)
      Object.assign(status, {
        base_path: info.file_path,
        name: info.name,
        version: info.version,
        browser_action: info.manifest && info.manifest.browser_action,
        icons: info.manifest && info.manifest.icons
      })

      return status
    })
  sender.send('extensions-status', {
    rootDir: getExtensionsPath(),
    list
  })
}

function onExtensionsChange() {
  BrowserWindow.getAllWindows().forEach(win => sendStatus(win.webContents))
}

function ipcError(sender: Electron.WebContents, err: Error) {
  log.error(err)
  sender.send('extensions-error', err.message)
}

async function ipcSet(event: Electron.Event, extId: string, enable: boolean) {
  log.debug(`[Extension] Setting extension ${extId} to ${enable}`)
  const session = getSession()
  if (enable) {
    enableExtension(session, extId)
  } else {
    disableExtension(session, extId)
  }
  onExtensionsChange()
}

function ipcStatus(event: Electron.Event) {
  sendStatus(event.sender)
}

function ipcReload(event: Electron.Event) {
  loadVendorExtensions(getSession())
  onExtensionsChange()
}

function initIpc(session: Electron.Session) {
  if (initialized) {
    ipcMain.removeListener('extensions-set', ipcSet)
    ipcMain.removeListener('extensions-status', ipcStatus)
    ipcMain.removeListener('extensions-reload', ipcReload)
  }

  ipcMain.on('extensions-set', ipcSet)
  ipcMain.on('extensions-status', ipcStatus)
  ipcMain.on('extensions-reload', ipcReload)
}
