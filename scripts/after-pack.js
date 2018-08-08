const os = require('os')
const path = require('path')
const { execSync } = require('child_process')

exports.default = async function(context) {
  if (os.platform() === 'darwin') {
    console.log('[macOS] Signing crashpad_handler')
    const basePath = path.join(__dirname, '..', 'release/mac/Metastream.app')
    const binPath = path.join(basePath, 'Contents/Frameworks/Brave Framework.framework/Helpers/crashpad_handler')
    execSync(`codesign --sign 22VNZVWGBB --force "${binPath}"`)
  }
}
