import { protocol } from 'electron'

export { registerAssetProtocol } from './asset-protocol'
export { registerBrowserProtocol } from './browser-protocol'

export function init() {
  protocol.registerStandardSchemes(['mp', 'asset'], { secure: true })
}
