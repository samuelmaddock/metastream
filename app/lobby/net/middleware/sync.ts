import { Middleware, MiddlewareAPI, Action, Dispatch } from "redux";
import deepDiff from 'deep-diff';
import { NetServer, NetConnection } from "lobby/types";

export const NetActionTypes = {
  UPDATE: '@@net/UPDATE'
}

export interface NetMiddlewareOptions {
  server: NetServer;
  host: boolean;
}

interface NetPayload {
  /** Version */
  v: number;

  /** Diff */
  d: deepDiff.IDiff;
}

export const netSyncMiddleware = (options: NetMiddlewareOptions): Middleware => {
  let COMMIT_NUMBER = 0;

  const { server, host } = options;
  console.log('[Net] Init netSync', options);

  return <S extends Object>({dispatch, getState}: MiddlewareAPI<S>) => {
    /** Relay state changes from Server to Clients */
    const relay = (delta: deepDiff.IDiff[]) => {
      const payload: NetPayload = { v: COMMIT_NUMBER, d: delta[0] };
      console.info(`[Net] Sending update #${COMMIT_NUMBER}`, payload);
      const buf = new Buffer(JSON.stringify(payload));
      server.send(buf);
    };

    // Apply diffs on connected clients
    server.on('data', (conn: NetConnection, data: Buffer) => {
      const obj = JSON.parse(data.toString()) as NetPayload;
      console.info(`[Net] Received update #${obj.v} from ${conn.id}`, obj);

      // apply diff to local state
      let state = getState();
      deepDiff.applyChange(state, state, obj.d);

      // trigger update noop
      dispatch({type: NetActionTypes.UPDATE, payload: obj.v});
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
