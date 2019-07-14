export const enum NetworkErrorCode {
  UnknownSession,
  SignalServerConnectionFailure,
  SignalServerDisconnect,
  SignalServerReconnect,
  SignalServerSessionNotFound,
  PeerAuthenticationFailure
}

export class NetworkError extends Error {
  constructor(
    public errorCode: NetworkErrorCode,
    message: string = `Network error [${errorCode}]`
  ) {
    super(message)
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}
