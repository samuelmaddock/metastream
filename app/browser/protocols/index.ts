import { app, protocol, session } from 'electron'
import { WEBVIEW_PARTITION } from 'constants/http';

import { registerAssetProtocol } from './asset-protocol'
import { registerBrowserProtocol } from './browser-protocol'

export function init() {
  protocol.registerStandardSchemes(['mp', 'asset'], { secure: true })

  app.once('ready', () => {
    // BUG: types expect second option as non-optional
    const ses = (session as any).fromPartition(WEBVIEW_PARTITION) as Electron.Session
    const webviewProtocol = ses.protocol

    const protos = [protocol, webviewProtocol]
    protos.forEach(proto => {
      registerAssetProtocol(proto)
      registerBrowserProtocol(proto)
    })
  })
}
