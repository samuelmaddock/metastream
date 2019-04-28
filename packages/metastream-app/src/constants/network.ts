export const METASTREAM_SIGNAL_SERVER =
  process.env.METASTREAM_SIGNAL_SERVER || 'wss://signal.rtc.getmetastream.com'

const METASTREAM_STUN_SERVERS = [
  { url: 'stun:stun1.l.google.com:19302' },
  { url: 'stun:stun2.l.google.com:19302' },
  { url: 'stun:stun3.l.google.com:19302' },
  { url: 'stun:stun4.l.google.com:19302' }
]
const METASTREAM_TURN_SERVER = {
  url: process.env.METASTREAM_TURN_SERVER || 'turn:turn.rtc.getmetastream.com:5349',
  username: process.env.METASTREAM_TURN_USERNAME || 'metastream',
  credential: process.env.METASTREAM_TURN_CREDENTIAL
}
export const METASTREAM_ICE_SERVERS = [...METASTREAM_STUN_SERVERS, METASTREAM_TURN_SERVER]

export const NETWORK_TIMEOUT = 15000
export const RECONNECT_TIMEOUT = 30000
export const WEBSOCKET_PORT_DEFAULT = 27064

export const enum NetworkDisconnectReason {
  HostDisconnect = 1,
  Timeout,
  InvalidClientInfo,
  VersionMismatch,
  Full,
  Kicked
}

export const NetworkDisconnectMessages = {
  [NetworkDisconnectReason.HostDisconnect]: 'networkDisconnectHostDisconnect',
  [NetworkDisconnectReason.Timeout]: 'networkDisconnectTimeout',
  [NetworkDisconnectReason.InvalidClientInfo]: 'networkDisconnectInvalidClientInfo',
  [NetworkDisconnectReason.VersionMismatch]: `networkDisconnectVersionMismatch`,
  [NetworkDisconnectReason.Full]: 'networkDisconnectFull',
  [NetworkDisconnectReason.Kicked]: 'networkDisconnectKicked'
}

export const NetworkDisconnectLabels = {
  [NetworkDisconnectReason.HostDisconnect]: 'host-disconnect',
  [NetworkDisconnectReason.Timeout]: 'timeout',
  [NetworkDisconnectReason.InvalidClientInfo]: 'invalid-client-info',
  [NetworkDisconnectReason.VersionMismatch]: `version-mismatch`,
  [NetworkDisconnectReason.Full]: 'full',
  [NetworkDisconnectReason.Kicked]: 'kicked'
}
