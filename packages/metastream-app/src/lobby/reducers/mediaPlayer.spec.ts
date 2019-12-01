import { configureTestStore } from 'utils/tests'
import { initLobby } from 'lobby/actions/common'
import { RepeatMode, PlaybackState } from './mediaPlayer'
import {
  INITIAL_TEST_APP_STATE,
  INITIAL_TEST_APP_STATE_WITH_MEDIA_SNAPSHOT
} from 'test/fixtures/app-state'

describe('mediaPlayer reducer', () => {
  describe('session management', () => {
    it('clears old state upon initializing session for host', () => {
      const store = configureTestStore({ initialState: INITIAL_TEST_APP_STATE })
      store.dispatch(initLobby({ host: true }))
      expect(store.getState().mediaPlayer).toEqual({
        playback: PlaybackState.Idle,
        repeatMode: RepeatMode.Off,
        startTime: undefined,
        pauseTime: undefined,
        current: undefined,
        queue: [],
        queueLocked: false,
        serverClockSkew: 0
      })
    })

    it('clears old state upon initializing session for guest', () => {
      const store = configureTestStore({ initialState: INITIAL_TEST_APP_STATE })
      store.dispatch(initLobby({ host: false }))
      expect(store.getState().mediaPlayer).toEqual({
        playback: PlaybackState.Idle,
        repeatMode: RepeatMode.Off,
        startTime: undefined,
        pauseTime: undefined,
        current: undefined,
        queue: [],
        queueLocked: false,
        serverClockSkew: 0
      })
    })

    it('restores session snapshot for host', () => {
      const testState = INITIAL_TEST_APP_STATE_WITH_MEDIA_SNAPSHOT
      const store = configureTestStore({ initialState: testState })
      store.dispatch(initLobby({ host: true }))
      expect(store.getState().mediaPlayer).toEqual({
        ...testState.mediaPlayer.localSnapshot,
        serverClockSkew: 0
      })
    })

    it('ignores session snapshot for guest', () => {
      const testState = INITIAL_TEST_APP_STATE_WITH_MEDIA_SNAPSHOT
      const store = configureTestStore({ initialState: testState })
      store.dispatch(initLobby({ host: false }))
      expect(store.getState().mediaPlayer).toEqual({
        localSnapshot: testState.mediaPlayer.localSnapshot,
        playback: PlaybackState.Idle,
        repeatMode: RepeatMode.Off,
        startTime: undefined,
        pauseTime: undefined,
        current: undefined,
        queue: [],
        queueLocked: false,
        serverClockSkew: 0
      })
    })
  })
})
