import fs from 'fs'
import path from 'path'
import { protocol } from 'electron'

const ASSETS_PATH = path.join(__dirname, '..', 'assets')

export function registerAssetProtocol() {
  protocol.registerFileProtocol('asset', (request, callback) => {
    let relativePath = path.normalize(request.url.substr(7))
    let filePath = path.join(ASSETS_PATH, relativePath)
    filePath = filePath.split('#').shift()
    callback({ path: filePath })
  })
}
