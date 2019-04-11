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
