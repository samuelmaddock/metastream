export const enum NetworkErrorCode {
  SignalServerConnectionFailure,
  SignalServerDisconnect,
  SignalServerReconnect,
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
