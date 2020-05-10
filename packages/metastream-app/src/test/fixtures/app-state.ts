import { IAppState } from 'reducers'
import { PlaybackState, RepeatMode } from 'lobby/reducers/mediaPlayer'
import { TEST_USER_PUBLIC_KEY } from './identity'
import * as Media from './media'

export const INITIAL_TEST_APP_STATE: IAppState = {
  router: {
    location: {
      pathname: `/join/${TEST_USER_PUBLIC_KEY}`,
      search: '',
      hash: '',
      state: {}
    }
  },
  chat: {
    messages: [],
    typing: []
  },
  mediaPlayer: {
    playback: PlaybackState.Paused,
    repeatMode: RepeatMode.Off,
    startTime: 1575235118509,
    pauseTime: 39465.4879172277,
    current: Media.YOUTUBE,
    queue: [Media.SOUNDCLOUD, Media.NETFLIX],
    queueLocked: false,
    serverClockSkew: 0
  },
  session: {
    id: TEST_USER_PUBLIC_KEY,
    users: 0,
    playback: PlaybackState.Paused,
    startTime: 1575235118509,
    secret: 'NFlYeW5PRERi',
    serverClockSkew: 0,
    maxUsers: 0,
    media: {
      url: 'https://www.youtube.com/watch?v=3bNITQR4Uso',
      title: 'Mariya Takeuchi 竹内 まりや Plastic Love',
      thumbnail: 'https://i.ytimg.com/vi/3bNITQR4Uso/maxresdefault.jpg',
      duration: 477000
    }
  },
  users: {
    host: TEST_USER_PUBLIC_KEY,
    map: {
      [TEST_USER_PUBLIC_KEY]: {
        id: TEST_USER_PUBLIC_KEY,
        name: 'sam',
        color: '#7cfcc6',
        role: 2
      }
    },
    invites: []
  },
  settings: {
    mute: false,
    volume: 0.7625,
    allowTracking: false,
    sessionMode: 0,
    language: 'en-US',
    chatLocation: 0,
    chatTimestamp: true,
    autoFullscreen: true,
    theaterMode: false,
    safeBrowse: true,
    username: 'sam',
    avatar: 'asset:default.svg',
    color: '#7cfcc6',
    maxUsers: 0
  },
  ui: {
    isExtensionInstalled: true
  }
}

export const INITIAL_TEST_APP_STATE_WITH_MEDIA_SNAPSHOT = {
  ...INITIAL_TEST_APP_STATE,
  mediaPlayer: {
    playback: PlaybackState.Idle,
    repeatMode: RepeatMode.Off,
    queue: [],
    queueLocked: false,
    serverClockSkew: 0,
    localSnapshot: {
      playback: PlaybackState.Paused,
      repeatMode: RepeatMode.Off,
      startTime: 1575235118509,
      pauseTime: 39465.4879172277,
      current: Media.YOUTUBE,
      queue: [Media.SOUNDCLOUD, Media.NETFLIX],
      queueLocked: false,
      serverClockSkew: 0
    }
  }
}
