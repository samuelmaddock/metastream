import { Middleware } from 'redux'
import * as deepDiff from 'deep-diff'

import { NetServer, NetConnection } from 'network'
import { ReplicatedState } from 'network/types'
import { NetMiddlewareOptions, NetActions } from 'network/actions'
import { isType, actionCreator } from 'utils/redux'
import { Diff } from 'reducers/deepDiff'
import { IAppState } from 'reducers'

export const netApplyFullUpdate = actionCreator<Partial<IAppState>>('@@net/APPLY_FULL_UPDATE')
export const netApplyUpdate = actionCreator<Diff[]>('@@net/APPLY_UPDATE')

const NetActionTypes = {
  FULL_UPDATE: 'FULL_UPDATE',
  UPDATE: 'UPDATE'
}

interface NetPayload {
  type: string

  /** Version */
  v: number

  /** Diff */
  d: deepDiff.Diff<any>[]
}

const SYNC_HEADER = 'SYNC'

/** Redux subtree replication */
export const createReplicationPrefilter = <T>(state: ReplicatedState<T>): deepDiff.PreFilter<T> => (
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
export const getReplicatedState = <T = any>(state: T, prefilter: deepDiff.PreFilter<T>) => {
  const repState = {}
  const diffs = deepDiff.diff(repState, state, prefilter)
  if (diffs && diffs.length) {
    diffs.forEach(diff => {
      deepDiff.applyChange(repState, repState, diff)
    })
  }
  return repState
}

export const netSyncMiddleware = (): Middleware => {
  let COMMIT_NUMBER = 0

  return store => {
    const { dispatch, getState } = store

    let server: NetServer | null, host: boolean, prefilter: deepDiff.PreFilter<any>

    const init = (options: NetMiddlewareOptions) => {
      server = options.server || null
      host = options.host

      prefilter = createReplicationPrefilter(options.replicated)
      console.debug('[Net] Init netSync', options)

      if (!server) return

      if (host) {
        server.on('connect', (conn: NetConnection) => {
          conn.once('authed', () => {
            const state = getReplicatedState(getState(), prefilter)
            const action = { type: NetActionTypes.FULL_UPDATE, v: COMMIT_NUMBER, state }
            const jsonStr = JSON.stringify(action)
            const buf = new Buffer(SYNC_HEADER + jsonStr)
            if (server) server.sendTo(conn.id.toString(), buf)
          })
        })
      }

      // Apply diffs on connected clients
      server.on('data', (conn: NetConnection, data: Buffer) => {
        if (data.indexOf(SYNC_HEADER) !== 0) {
          return
        }

        const json = data.toString('utf-8', SYNC_HEADER.length)
        const action = JSON.parse(json)
        console.debug(`[Net] Received action #${action.type} from ${conn.id}`, action)

        switch (action.type) {
          case NetActionTypes.FULL_UPDATE:
            COMMIT_NUMBER = action.v
            const partialState = action.state as Partial<IAppState>
            dispatch(netApplyFullUpdate(partialState))
            break
          case NetActionTypes.UPDATE:
            const diffs = action.d as Diff[]
            dispatch(netApplyUpdate(diffs))
            break
        }
      })
    }

    const destroy = () => {
      server = null
      COMMIT_NUMBER = 0
    }

    /** Relay state changes from Server to Clients */
    const relay = (delta: deepDiff.Diff<any>[]) => {
      // Cleanup diffs to reduce bandwidth
      delta = delta.map(dt => {
        dt = { ...dt }
        if (dt.kind === 'E') {
          delete dt.lhs
        }
        return dt
      })

      console.debug('[Net] netSyncMiddleware delta', delta)

      const action: NetPayload = {
        type: NetActionTypes.UPDATE,
        v: COMMIT_NUMBER,
        d: delta
      }

      console.debug(`[Net] Sending update #${COMMIT_NUMBER}`, action)

      const jsonStr = JSON.stringify(action)
      const buf = new Buffer(SYNC_HEADER + jsonStr)
      if (server) server.send(buf)
    }

    return next => action => {
      if (isType(action, NetActions.connect)) {
        init(action.payload)
        return next(action)
      } else if (isType(action, NetActions.disconnect)) {
        destroy()
        return next(action)
      }

      const prevState = getState()
      const result = next(action)

      if (!host || !server) {
        return result
      }

      const state = getState()
      const delta = deepDiff.diff(prevState, state, prefilter)

      if (delta && delta.length > 0) {
        relay(delta)
        COMMIT_NUMBER++
      }

      return result
    }
  }
}
