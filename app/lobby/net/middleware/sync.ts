import { Middleware, MiddlewareAPI, Action, Dispatch } from "redux";
import deepDiff from 'deep-diff';
import { NetServer, NetConnection } from "lobby/types";
import { clone } from "utils/object";

export const NetReduxActionTypes = {
  UPDATE: '@@net/UPDATE'
}

export interface NetMiddlewareOptions {
  server: NetServer;
  host: boolean;
}

const NetActionTypes = {
  FULL_UPDATE: 'FULL_UPDATE',
  UPDATE: 'UPDATE'
}

interface NetPayload {
  type: string;

  /** Version */
  v: number;

  /** Diff */
  d: deepDiff.IDiff;
}

const SYNC_HEADER = 'SYNC';

export const netSyncMiddleware = (options: NetMiddlewareOptions): Middleware => {
  let COMMIT_NUMBER = 0;

  const { server, host } = options;
  console.log('[Net] Init netSync', options);

  return <S extends Object>(store: MiddlewareAPI<S>) => {
    const {dispatch, getState} = store;

    /** Relay state changes from Server to Clients */
    const relay = (delta: deepDiff.IDiff[]) => {
      const action: NetPayload = {
        type: NetActionTypes.UPDATE,
        v: COMMIT_NUMBER,
        d: delta[0]
      };
      console.info(`[Net] Sending update #${COMMIT_NUMBER}`, action);
      const jsonStr = JSON.stringify(action);
      const buf = new Buffer(SYNC_HEADER + jsonStr);
      server.send(buf);
    };

    if (host) {
      server.on('connect', (conn: NetConnection) => {
        const state = getState();
        const action = { type: NetActionTypes.FULL_UPDATE, v: COMMIT_NUMBER, state };
        const jsonStr = JSON.stringify(action);
        const buf = new Buffer(SYNC_HEADER + jsonStr);
        server.sendTo(conn.id, buf);
      });
    }

    // Apply diffs on connected clients
    server.on('data', (conn: NetConnection, data: Buffer) => {
      if (data.indexOf(SYNC_HEADER) !== 0) {
        return;
      }

      const json = data.toString('utf-8', SYNC_HEADER.length);
      const action = JSON.parse(json);
      console.info(`[Net] Received action #${action.type} from ${conn.id}`, action);

      switch (action.type) {
        case NetActionTypes.FULL_UPDATE:
          COMMIT_NUMBER = action.v;
          Object.assign(getState(), action.state);

          // trigger update noop - forces rerender of applied diff
          dispatch({type: NetReduxActionTypes.UPDATE});
          break;
        case NetActionTypes.UPDATE:
          // apply diff to local state
          let state = clone(getState());
          deepDiff.applyChange(state, state, action.d);
          Object.assign(getState(), state);

          // TODO: Write a redux middleware to apply minimal changes of state tree.
          // Calling `clone` for each networked state update will be bad prob.

          // trigger update noop - forces rerender of applied diff
          dispatch({type: NetReduxActionTypes.UPDATE});
          break;
      }
    });

    return (next: Dispatch<S>) => <A extends Action, B>(action: A): B|Action => {
      if (!host) {
        return next(<A>action);
      }

      const stateA = getState();
      console.log('[Net] netSyncMiddleware 1', action, stateA);

      const result = next(<A>action);
      const stateB = getState();

      const delta = deepDiff.diff(stateA, stateB);

      console.log('[Net] netSyncMiddleware 2', stateB);
      console.log('[Net] netSyncMiddleware delta', delta);

      relay(delta);
      COMMIT_NUMBER++;

      return result;
    };
  };
};
