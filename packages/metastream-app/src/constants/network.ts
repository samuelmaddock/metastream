export const METASTREAM_SIGNAL_SERVER =
  process.env.METASTREAM_SIGNAL_SERVER || 'ws://sig1.rtc.getmetastream.com:27064'
export const METASTREAM_STUN_SERVERS = [
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302'
]
export const METASTREAM_TURN_SERVER = undefined

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
