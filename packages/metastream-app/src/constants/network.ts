/**
 * Network version the client is currently using. This must match when
 * connecting to other clients. Will result in a VersionMismatch error
 * otherwise.
 *
 * This should be incremented each time a developer updates the design
 * of networked data structures.
 */
export const METASTREAM_NETWORK_VERSION = 1

export const METASTREAM_SIGNAL_SERVER =
  process.env.METASTREAM_SIGNAL_SERVER || 'wss://signal.rtc.getmetastream.com'

const METASTREAM_STUN_SERVERS = [
  { url: 'stun:stun1.l.google.com:19302' },
  { url: 'stun:stun2.l.google.com:19302' }
]
const METASTREAM_TURN_SERVER = {
  url: process.env.METASTREAM_TURN_SERVER || 'turn:turn.rtc.getmetastream.com:5349?transport=tcp',
  username: process.env.METASTREAM_TURN_USERNAME || 'metastream',
  credential: process.env.METASTREAM_TURN_CREDENTIAL
}

// prettier-ignore
export const METASTREAM_ICE_SERVERS = [
  ...METASTREAM_STUN_SERVERS,
  METASTREAM_TURN_SERVER
]

export const NETWORK_TIMEOUT = 30e3
export const RECONNECT_TIMEOUT = 30e3
export const WEBSOCKET_PORT_DEFAULT = 27064

export const enum NetworkDisconnectReason {
  HostDisconnect = 1,
  Timeout,
  InvalidClientInfo,
  VersionMismatch,
  Full,
  Kicked,
  MultiTab
}

export const NetworkDisconnectMessages = {
  [NetworkDisconnectReason.HostDisconnect]: 'networkDisconnectHostDisconnect',
  [NetworkDisconnectReason.Timeout]: 'networkDisconnectTimeout',
  [NetworkDisconnectReason.InvalidClientInfo]: 'networkDisconnectInvalidClientInfo',
  [NetworkDisconnectReason.VersionMismatch]: `networkDisconnectVersionMismatch`,
  [NetworkDisconnectReason.Full]: 'networkDisconnectFull',
  [NetworkDisconnectReason.Kicked]: 'networkDisconnectKicked',
  [NetworkDisconnectReason.MultiTab]: 'networkDisconnectMultiTab'
}

export const NetworkDisconnectLabels = {
  [NetworkDisconnectReason.HostDisconnect]: 'host-disconnect',
  [NetworkDisconnectReason.Timeout]: 'timeout',
  [NetworkDisconnectReason.InvalidClientInfo]: 'invalid-client-info',
  [NetworkDisconnectReason.VersionMismatch]: `version-mismatch`,
  [NetworkDisconnectReason.Full]: 'full',
  [NetworkDisconnectReason.Kicked]: 'kicked',
  [NetworkDisconnectReason.MultiTab]: 'multi-tab'
}
