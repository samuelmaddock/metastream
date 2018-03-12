import fs from 'fs-extra'
import path from 'path'
import { app, session, dialog, componentUpdater, ipcMain } from 'electron'
import log from './log'
import * as widevine from 'constants/widevine'
import request from 'request'
import { CDN_URL } from 'constants/api'
import * as AdmZip from 'adm-zip'
import * as CrxReader from 'chrome-ext-downloader'

const extVerRegex = /^[\d._]+$/
const isExtVersion = (dirName: string) => !!extVerRegex.exec(dirName)
const getExtensionsPath = () => `${app.getPath('userData')}/Extensions`

const activeExtensions = new Set<string>()

const loadExtension = (session: Electron.session, extId: string, extPath: string) => {
  session.extensions.load(extPath, {}, 'unpacked')
  activeExtensions.add(extId)
}

const disableExtension = (session: Electron.session, extId: string) => {
  session.extensions.disable(extId)
  activeExtensions.delete(extId)
}

const getActiveExtensions = () => Array.from(activeExtensions)

const APP_EXTENSIONS = ['netflix-content-script', 'enhanced-media-viewer', 'media-remote']
const VENDOR_EXTENSIONS = ['cjpalhdlnbpafiamejdnhcphjbkeiagm']

export function initExtensions() {
  const mediaSession = session.fromPartition('persist:mediaplayer', { cache: true })

  loadMediaExtensions(mediaSession)
  loadVendorExtensions(mediaSession)
  loadComponents()
  initIpc(mediaSession)
}

function readExtensionsInDir(
  dir: string,
  extIds: string[],
  cb: (err: Error | null, extId?: string, dir?: string) => void
) {
  extIds.forEach(extId => {
    let stat
    const extPath = path.join(dir, `${extId}`)

    try {
      stat = fs.statSync(extPath)
    } catch (e) {
      cb(e, extId)
      return
    }

    // TODO: find latest version folder
    const dirs = fs.readdirSync(extPath)
    const extVersion = dirs.find(isExtVersion)
    const fullPath = extVersion && path.join(extPath, extVersion)

    try {
      stat = fullPath && fs.statSync(fullPath)
    } catch (e) {
      cb(e, extId)
      return
    }

    cb(null, extId, fullPath)
  })
}

function loadVendorExtensions(session: Electron.Session) {
  const extDir = getExtensionsPath()

  if (!fs.existsSync(extDir)) {
    fs.mkdirSync(extDir)
  }

  readExtensionsInDir(extDir, VENDOR_EXTENSIONS, (err, extId, dir) => {
    if (err) {
      log.debug(`Skipping uninstalled extension ${extId}`)
      return
    }

    log.debug(`Loading extension ${extId}`)
    session.extensions.load(dir, {}, 'unpacked')
  })
}

function loadMediaExtensions(session: Electron.Session) {
  const extDir = process.env.NODE_ENV === 'production' ? '../extensions' : '/extensions'
  const extRoot = path.normalize(path.join(__dirname, extDir))

  readExtensionsInDir(extRoot, APP_EXTENSIONS, (err, extId, dir) => {
    if (err) {
      log.error(err)
      return
    }

    log.debug(`Loading extension ${extId}`)
    session.extensions.load(dir, {}, 'unpacked')
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

const activeInstalls: { [key: string]: request.Request | null } = {}

function installExtension(extId: string) {
  return new Promise((resolve, reject) => {
    if (activeInstalls[extId]) {
      reject('Pending installation')
      return
    }

    // TODO: fetch version from remote?
    const version = '1.15.2'
    const extDest = path.join(getExtensionsPath(), extId, version)
    const extUrl = `${CDN_URL}/extensions/${extId}.crx`

    const req = request({ uri: extUrl, encoding: null }, (err, res, body) => {
      activeInstalls[extId] = null

      if (err || res.statusCode !== 200) {
        reject(`Failed to download extension ${extId}\n${err}`)
        return
      }

      // We need to extract the public key from the CRX header.
      // See: https://developer.chrome.com/apps/crx
      let reader = new CrxReader(body)
      let preamble = 16
      let keyLength = reader.data.readUInt32LE(8)
      let publicKey = reader.data.slice(preamble, preamble + keyLength).toString('base64')

      // Unzip CRX and sign the manifest file with the key.
      let contents = reader.getZipContents()
      let zip = new AdmZip(contents)
      zip.extractAllToAsync(extDest, true, () => {
        let manifestFile = path.join(extDest, 'manifest.json')
        fs.readFile(manifestFile, 'utf8', (err, data) => {
          if (err) log.error(err)
          let manifest = JSON.parse(data)
          manifest.key = publicKey
          fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2), 'utf8', () =>
            resolve(extDest)
          )
        })
      })
    })
    activeInstalls[extId] = req
  })
}

async function removeExtension(extId: string) {
  const activeReq = activeInstalls[extId]
  if (activeReq) {
    activeReq.abort()
    activeInstalls[extId] = null
  }

  const extPath = path.join(getExtensionsPath(), extId)
  await fs.remove(extPath)
}

function initIpc(session: Electron.Session) {
  const error = (sender: Electron.WebContents, err: Error) => {
    log.error(err)
    sender.send('extensions-error', err.message)
  }

  ipcMain.on('extensions-install', async (event: Electron.Event, extId: string) => {
    try {
      await installExtension(extId)
    } catch (e) {
      error(event.sender, e)
      return
    }
    loadVendorExtensions(session)
  })

  ipcMain.on('extensions-remove', async (event: Electron.Event, extId: string) => {
    session.extensions.disable(extId)
    try {
      await removeExtension(extId)
    } catch (e) {
      error(event.sender, e)
      return
    }
  })

  ipcMain.on('extensions-list', (event: Electron.Event) => {
    const list = VENDOR_EXTENSIONS.map(extId => {
      return { id: extId, enabled: activeExtensions.has(extId) }
    })
    event.sender.send('extensions-list-result', list)
  })
}
