import { configureTestStore } from 'utils/tests'
import { initLobby } from 'lobby/actions/common'
import { RepeatMode, PlaybackState, IMediaPlayerState, PlaybackRate } from './mediaPlayer'
import {
  INITIAL_TEST_APP_STATE,
  INITIAL_TEST_APP_STATE_WITH_MEDIA_SNAPSHOT
} from 'test/fixtures/app-state'
import { setPlaybackRate, playPauseMedia, endMedia, seekMedia } from 'lobby/actions/mediaPlayer'
import { getPlaybackTime, getCurrentMedia } from './mediaPlayer.helpers'

const MS2SEC = 1 / 1000

describe('mediaPlayer reducer', () => {
  describe('session management', () => {
    it('clears old state upon initializing session for host', () => {
      const store = configureTestStore({ initialState: INITIAL_TEST_APP_STATE })
      store.dispatch(initLobby({ host: true }))
      expect(store.getState().mediaPlayer).toEqual({
        playback: PlaybackState.Idle,
        playbackRate: PlaybackRate.Default,
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
        playbackRate: PlaybackRate.Default,
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
        playbackRate: PlaybackRate.Default,
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

  describe('playback rate', () => {
    let store: ReturnType<typeof configureTestStore>

    beforeEach(() => {
      store = configureTestStore({ initialState: INITIAL_TEST_APP_STATE })
    })

    it('set while paused', () => {
      const initialTime = getPlaybackTime(store.getState() as any) * MS2SEC
      store.dispatch(setPlaybackRate(PlaybackRate.Min))

      expect(store.getState().mediaPlayer!.playbackRate).toEqual(PlaybackRate.Min)
      expect(getPlaybackTime(store.getState() as any) * MS2SEC).toBeCloseTo(initialTime)
    })

    it('set while playing', () => {
      const initialTime = getPlaybackTime(store.getState() as any) * MS2SEC
      store.dispatch(playPauseMedia()) // start playing
      store.dispatch(setPlaybackRate(PlaybackRate.Max))

      expect(store.getState().mediaPlayer!.playbackRate).toEqual(PlaybackRate.Max)
      expect(getPlaybackTime(store.getState() as any) * MS2SEC).toBeCloseTo(initialTime)
    })

    it('maintain time on seek', () => {
      store.dispatch(setPlaybackRate(PlaybackRate.Max))

      const current = getCurrentMedia(store.getState() as any)!
      const halfwayTime = current.duration! / 2
      store.dispatch(seekMedia(halfwayTime))

      expect(getPlaybackTime(store.getState() as any)).toBeCloseTo(halfwayTime)
    })

    it('reset when media ends', () => {
      store.dispatch(setPlaybackRate(PlaybackRate.Max))
      store.dispatch(endMedia())

      expect(store.getState().mediaPlayer!.playbackRate).toEqual(PlaybackRate.Default)
    })
  })
})
