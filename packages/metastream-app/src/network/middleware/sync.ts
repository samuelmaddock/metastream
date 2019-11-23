import { Middleware } from 'redux'

import { NetServer, NetConnection } from 'network'
import { NetMiddlewareOptions, NetActions } from 'network/actions'
import { isType, actionCreator } from 'utils/redux'
import { Diff } from 'reducers/deepDiff'
import { IAppState } from 'reducers'
import { getReplicatedState, getReplicatedDelta, ReplicatedDelta } from './sync.util'
import { ReplicatedState } from 'network/types'

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
  d: ReplicatedDelta
}

const SYNC_HEADER = new Buffer('SYNC')

export const netSyncMiddleware = (): Middleware => {
  let COMMIT_NUMBER = 0

  return store => {
    const { dispatch, getState } = store

    let server: NetServer | null, host: boolean, replicated: ReplicatedState<any>

    const init = (options: NetMiddlewareOptions) => {
      server = options.server || null
      host = options.host
      replicated = options.replicated

      console.debug('[Net] Init netSync', options)

      if (!server) return

      if (host) {
        server.on('connect', (conn: NetConnection) => {
          conn.once('authed', () => {
            const state = getReplicatedState(getState(), options.replicated)
            const action = { type: NetActionTypes.FULL_UPDATE, v: COMMIT_NUMBER, state }
            const jsonStr = JSON.stringify(action)
            const buf = new Buffer(SYNC_HEADER + jsonStr)
            if (server) server.sendTo(conn.id.toString(), buf)
          })
        })
      }

      // Apply diffs on connected clients
      server.on('data', (conn: NetConnection, data: Buffer) => {
        if (!data.slice(0, SYNC_HEADER.length).equals(SYNC_HEADER)) {
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
    const relay = (delta: ReplicatedDelta) => {
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
      const delta = getReplicatedDelta(prevState, state, replicated)

      if (delta && delta.length > 0) {
        relay(delta)
        COMMIT_NUMBER++
      }

      return result
    }
  }
}
