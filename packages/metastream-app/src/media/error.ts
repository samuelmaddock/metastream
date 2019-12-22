export const enum MediaRequestErrorCode {
  Generic,
  NotAllowed,
  InvalidContentType,
  DownloadLink
}

export class MediaRequestError extends Error {
  constructor(public code: MediaRequestErrorCode) {
    super(`Media Request Error (${code})`)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, MediaRequestError.prototype)
  }
}
