import { configureTestStore } from 'utils/tests'
import { Store } from 'redux'
import { initLobby } from 'lobby/actions/common'
import { RepeatMode, PlaybackState } from './mediaPlayer'

describe('mediaPlayer reducer', () => {
  describe('session management', () => {
    let store: Store

    beforeEach(() => {
      store = configureTestStore()
    })

    it('clears old state upon initializing session', () => {
      // TODO: initialize store with 'current' media state
      // TODO: somewhere in the dependency chain libsodium is being included, can we not?
      // ^ to speedup test
      store.dispatch({ type: initLobby, payload: { host: false } })
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
  })
})
