declare var FEATURE_SESSION_BROWSER: boolean
declare var FEATURE_POPUP_PLAYER: boolean

declare var ga: any

interface Window {
  ga: any

  // Media Session API
  MediaMetadata: any
}

interface Navigator {
  // Media Session API
  mediaSession: any
}
