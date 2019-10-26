import { deepCloneState, getReplicatedState, getReplicatedDelta } from './sync.util'

describe('redux sync middleware', () => {
  describe('deep clone state', () => {
    it('filters subtrees', () => {
      const state = {
        a: 1,
        b: 2,
        c: {
          d: 2,
          e: 3
        },
        f: [1],
        g: { h: 1, i: 2 }
      }
      const filter = {
        a: true,
        b: false,
        c: {
          d: true,
          e: false
        },
        f: true,
        g: {
          h: true,
          i: false
        }
      }
      expect(deepCloneState(state, filter)).toEqual({
        a: 1,
        c: {
          d: 2
        },
        f: [1],
        g: { h: 1 }
      })
    })

    it('clones arrays', () => {
      const state = {
        a: [{ b: 1 }, { c: 2 }]
      }
      const filter = {
        a: {
          b: true
        }
      }
      expect(deepCloneState(state, filter)).toEqual({
        a: [{ b: 1 }, {}]
      })
    })

    it('handles paths with indicies', () => {
      const partialState = { b: 1, c: 2 }
      const filter = {
        a: {
          b: true
        }
      }
      expect(deepCloneState(partialState, filter, ['a', 0])).toEqual({
        b: 1
      })
    })
  })

  describe('replicated state', () => {
    it('creates empty state', () => {
      const state = getReplicatedState({}, {})
      expect(state).toEqual({})
    })

    it('filters partial state', () => {
      const initialState = {
        replicated: 'foo',
        nope: 'nope'
      }
      const replicated = {
        replicated: true,
        nope: false
      }
      const state = getReplicatedState(initialState, replicated)
      expect(state).toEqual({ replicated: 'foo' })
    })

    it('filters nested partial state', () => {
      const initialState = {
        a: {
          b: 1,
          c: 2
        }
      }
      const replicated = {
        a: {
          b: true,
          c: false
        }
      }
      const state = getReplicatedState(initialState, replicated)
      expect(state).toEqual({ a: { b: 1 } })
    })

    it('filters full objects', () => {
      const initialState = {
        a: {
          b: 1,
          c: 2
        }
      }
      const replicated = {
        a: true
      }
      const state = getReplicatedState(initialState, replicated)
      expect(state).toEqual({ a: { b: 1, c: 2 } })
    })
  })

  describe('replicated delta', () => {
    it('creates delta without unreplicated state', () => {
      const prevState = {}
      const state = {
        a: {
          b: 1,
          c: 2
        }
      }
      const replicated = {
        a: {
          b: true,
          c: false
        }
      }
      const delta = getReplicatedDelta(prevState, state, replicated)
      expect(delta).toEqual([{ kind: 'N', rhs: { b: 1 }, path: ['a'] }])
    })

    it('creates delta with filtered array addition', () => {
      const prevState = { a: [], c: [] }
      const state = {
        a: [{ b: 1 }],
        c: [{ d: 1, e: 2 }]
      }
      const replicated = {
        a: true,
        c: { d: true }
      }
      const delta = getReplicatedDelta(prevState, state, replicated)
      expect(delta).toEqual([
        { kind: 'A', path: ['a'], index: 0, item: { kind: 'N', rhs: { b: 1 } } },
        { kind: 'A', path: ['c'], index: 0, item: { kind: 'N', rhs: { d: 1 } } }
      ])
    })

    it('optimizes diffs', () => {
      const prevState = { a: 0, c: 3, d: [] }
      const state = {
        a: 1,
        b: 2,
        d: [1]
      }
      const replicated = {
        a: true,
        b: true,
        c: true,
        d: true
      }
      const delta = getReplicatedDelta(prevState, state, replicated)
      expect(delta).toEqual([
        { kind: 'E', path: ['a'], rhs: 1 },
        { kind: 'D', path: ['c'] },
        { kind: 'A', path: ['d'], index: 0, item: { kind: 'N', rhs: 1 } },
        { kind: 'N', path: ['b'], rhs: 2 }
      ])
    })
  })
})
