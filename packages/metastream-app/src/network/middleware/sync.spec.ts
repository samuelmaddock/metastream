import { getReplicatedState, createReplicationPrefilter } from './sync'

describe('redux sync middleware', () => {
  describe('replicated state', () => {
    it('creates empty state', () => {
      const prefilter = createReplicationPrefilter({})
      const state = getReplicatedState({}, prefilter)
      expect(state).toEqual({})
    })
  })
})
