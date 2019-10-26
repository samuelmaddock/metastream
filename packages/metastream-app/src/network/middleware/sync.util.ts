import { ReplicatedState } from 'network/types'
import * as deepDiff from 'deep-diff'

export type ReplicatedDelta = deepDiff.Diff<any>[]
type ReplicatedPath = (string | number)[]

/** Redux subtree replication */
const createReplicationPrefilter = <T>(state: ReplicatedState<T>): deepDiff.PreFilter<T> => (
  path,
  key
) => {
  let i = 0
  let tree: ReplicatedState<any> = state

  // traverse path in tree
  while (i < path.length) {
    const k = path[i]
    if (tree.hasOwnProperty(k)) {
      const result = tree[k] as boolean | ReplicatedState<T>
      if (typeof result === 'object') {
        tree = result
      } else if (typeof result === 'boolean') {
        return !result
      }
    } else {
      return true // ignore undefined replication path
    }
    i++
  }

  if (tree && tree.hasOwnProperty(key)) {
    const result = tree[key]!
    if (typeof result === 'boolean') {
      return !result
    } else if (typeof result === 'object') {
      return false
    }
  }

  return true // ignore undefined replication path
}

/** Get tree containing only replicated state. */
export const getReplicatedState = <T = any>(state: T, replicated: ReplicatedState<T>) => {
  const repState = deepCloneState(state, replicated)
  return repState
}

const processDiff = (
  diff: deepDiff.Diff<any>,
  replicated: ReplicatedState<any>,
  path: ReplicatedPath = []
) => {
  diff = { ...diff } // remove prototype

  // cleanup diffs to reduce bandwidth
  switch (diff.kind) {
    case 'N':
      const { rhs } = diff
      diff.rhs =
        typeof rhs === 'object'
          ? deepCloneState(rhs, replicated, [...path, ...(diff.path || [])])
          : rhs
      break
    case 'E':
    case 'D':
      delete diff.lhs
      break
    case 'A':
      diff.item = processDiff(diff.item, replicated, diff.path)
      break
  }

  return diff
}

export const getReplicatedDelta = (
  prevState: any,
  state: any,
  replicated: ReplicatedState<any>
) => {
  const prefilter = createReplicationPrefilter(replicated)
  const delta = deepDiff.diff(prevState, state, prefilter)
  if (!delta) return
  return delta.map(diff => processDiff(diff, replicated))
}

const traverseReplicationPath = (obj: ReplicatedState<any>, path: ReplicatedPath) => {
  let tree = obj
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (typeof key === 'number') {
      // array indicies can be ignored
      continue
    }
    if (tree.hasOwnProperty(key)) {
      const newValue = tree[key]
      if (typeof newValue === 'boolean') {
        return newValue
      } else if (typeof newValue === 'object') {
        tree = newValue
      } else {
        return
      }
    } else {
      return
    }
  }
  return tree
}

export const deepCloneState = <T extends Object>(
  tree: T,
  filterTree: ReplicatedState<any>,
  path: ReplicatedPath = []
) => {
  const copy: any = {}
  for (let key in tree) {
    if (!tree.hasOwnProperty(key)) continue
    const value = tree[key]

    const newPath = [...path, key]
    const filterValue = traverseReplicationPath(filterTree, newPath)
    if (!filterValue) continue

    if (Array.isArray(value)) {
      if (typeof filterValue === 'boolean') {
        copy[key] = [...value]
      } else {
        copy[key] = value.map(item => deepCloneState(item, filterTree, newPath)).filter(Boolean)
      }
    } else if (typeof value === 'object') {
      copy[key] = deepCloneState(value, filterTree, newPath)
    } else if (typeof value !== 'undefined') {
      copy[key] = value
    }
  }
  return copy
}
