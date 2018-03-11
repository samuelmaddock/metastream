import fs from 'fs'
import path from 'path'
import { session, dialog, componentUpdater } from 'electron'
import log from './log'
import * as widevine from 'constants/widevine'

const extVerRegex = /^[\d._]+$/
const isExtVersion = (dirName: string) => !!extVerRegex.exec(dirName)

const extensionIds = ['netflix-content-script', 'enhanced-media-viewer', 'media-remote']

export function initExtensions() {
  loadMediaExtensions()
  loadComponents()
}

function loadMediaExtensions() {
  const ses = session.fromPartition('persist:mediaplayer', { cache: true })
  const { extensions } = ses as any

  const extDir = process.env.NODE_ENV === 'production' ? '../extensions' : '/extensions'
  const extRoot = path.normalize(path.join(__dirname, extDir))

  extensionIds.forEach(extId => {
    const extPath = path.join(extRoot, `${extId}`)

    let stat
    let err

    try {
      stat = fs.statSync(extPath)
    } catch (e) {
      err = e
      log.error(`${extPath}\n\n${JSON.stringify(stat)}\n\n${JSON.stringify(err)}`)
    }

    if (stat) {
      const dirs = fs.readdirSync(extPath)
      const extVersion = dirs.find(isExtVersion)
      const fullPath = extVersion && path.join(extPath, extVersion)

      try {
        stat = fullPath && fs.statSync(fullPath)
      } catch (e) {}

      if (stat) {
        log(`Loading extension ${extId}`)
        extensions.load(fullPath, {}, 'unpacked')
      }
    }
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
    log(`[Component] Checking for update ${cid}`)
  })
  componentUpdater.on('component-update-found', (e: any, cid: string) => {
    log(`[Component] Update found ${cid}`)
  })
  componentUpdater.on('component-update-ready', (e: any, cid: string) => {
    log(`[Component] Update ready ${cid}`)
  })
  componentUpdater.on('component-update-updated', (e: any, cid: string, version: string) => {
    log(`[Component] Updated ${cid} to ${version}`)
  })
  componentUpdater.on('component-ready', (e: any, cid: string, extensionPath: string) => {
    log(`[Component] ${cid} ready in ${extensionPath}`)
  })
  componentUpdater.on('component-not-updated', (e: any, cid: string) => {
    log(`[Component] ${cid} not updated`)
  })
  componentUpdater.on('component-registered', (e: any, cid: string) => {
    log(`[Component] ${cid} registered`)

    componentUpdater.checkNow(cid)
  })

  log(`Registering widevine component ${widevine.widevineComponentId}`)
  registerComponent(widevine.widevineComponentId, widevine.widevineComponentPublicKey)
}
