import fs from 'fs'
import path from 'path'
import { protocol } from 'electron'
import { ASSETS_PATH } from 'constants/path';

export function registerAssetProtocol() {
  protocol.registerFileProtocol('asset', (request, callback) => {
    let relativePath = path.normalize(request.url.substr(7))
    let filePath = path.join(ASSETS_PATH, relativePath)
    filePath = filePath.split('#').shift()!
    callback(filePath)
  })
}
