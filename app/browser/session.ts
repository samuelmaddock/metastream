import { session } from 'electron'
import { WEBVIEW_PARTITION } from 'constants/http'

let mediaSession: Electron.Session

export const getMediaSession = () => {
  if (!mediaSession) {
    mediaSession = session.fromPartition(WEBVIEW_PARTITION, { cache: true })
  }
  return mediaSession
}
