import fs from 'fs'
import path from 'path'
import { protocol } from 'electron'
import { SOURCE_PATH, BUILTIN_PAGES_PATH, RESOURCES_PATH } from 'constants/path'

const PROTOCOL_PREFIX = 'mp'
const PREFIX_LENGTH = PROTOCOL_PREFIX.length + 3

const resourceManifest: any = {
  menu: {
    file: path.join(BUILTIN_PAGES_PATH, 'app.html')
  },
  'new-tab': {
    file: path.join(BUILTIN_PAGES_PATH, 'homescreen.html')
  },
  idlescreen: {
    file: path.join(BUILTIN_PAGES_PATH, 'idlescreen.html')
  },
  resources: {
    file: RESOURCES_PATH
  }
}

export function registerBrowserProtocol() {
  // TODO: don't allow referrer to nest in iframe
  // TODO: deal with resource loading
  protocol.registerFileProtocol(PROTOCOL_PREFIX, (request, callback) => {
    let relativePath = path.normalize(request.url.substr(PREFIX_LENGTH))
    let parsed = path.parse(relativePath)

    console.log('TEST', parsed)

    if (relativePath.endsWith('/')) {
      relativePath = relativePath.substr(0, relativePath.length - 1)
    }

    console.log('RESOLVING', relativePath)

    if (resourceManifest.hasOwnProperty(relativePath)) {
      let fileName = resourceManifest[relativePath].file
      let filePath = path.join(SOURCE_PATH, 'builtin-pages', fileName)
      callback(filePath)
      return
    }

    callback()
  })
}
