import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux';
import deepDiff from 'deep-diff';
import { clone } from 'utils/object';

import { NetServer, NetConnection } from 'network';
import { ReplicatedState } from 'network/types';

export const NetReduxActionTypes = {
  UPDATE: '@@net/UPDATE'
};

export interface NetMiddlewareOptions {
  server: NetServer;
  host: boolean;
  replicated: ReplicatedState<any>;
}

const NetActionTypes = {
  FULL_UPDATE: 'FULL_UPDATE',
  UPDATE: 'UPDATE'
};

interface NetPayload {
  type: string;

  /** Version */
  v: number;

  /** Diff */
  d: deepDiff.IDiff[];
}

const SYNC_HEADER = 'SYNC';

/** Redux subtree replication */
const replicationPrefilter = <T>(state: ReplicatedState<T>): deepDiff.IPrefilter => (path, key) => {
  let i = 0;
  let tree: ReplicatedState<any> = state;

  // traverse path in tree
  while (i < path.length) {
    const k = path[i];
    if (tree.hasOwnProperty(k)) {
      const result = (state as any)[k]! as boolean | ReplicatedState<T>;
      if (typeof result === 'object') {
        tree = result;
      } else if (typeof result === 'boolean') {
        return !result;
      }
    } else {
      return true; // ignore undefined replication path
    }
    i++;
  }

  if (tree && tree.hasOwnProperty(key)) {
    const result = tree[key]!;
    if (typeof result === 'boolean') {
      return !result;
    }
  }

  return true; // ignore undefined replication path
};

export const netSyncMiddleware = (options: NetMiddlewareOptions): Middleware => {
  let COMMIT_NUMBER = 0;

  const { server, host } = options;
  const prefilter = replicationPrefilter(options.replicated);
  console.log('[Net] Init netSync', options);

  return <S extends Object>(store: MiddlewareAPI<S>) => {
    const { dispatch, getState } = store;

    /** Get tree containing only replicated state. */
    const getReplicatedState = () => {
      const state = {};
      const diffs = deepDiff.diff(state, getState(), prefilter);
      if (diffs && diffs.length) {
        diffs.forEach(diff => {
          deepDiff.applyChange(state, state, diff);
        });
      }
      return state;
    };

    /** Relay state changes from Server to Clients */
    const relay = (delta: deepDiff.IDiff[]) => {
      const action: NetPayload = {
        type: NetActionTypes.UPDATE,
        v: COMMIT_NUMBER,
        d: delta
      };
      console.info(`[Net] Sending update #${COMMIT_NUMBER}`, action);
      const jsonStr = JSON.stringify(action);
      const buf = new Buffer(SYNC_HEADER + jsonStr);
      server.send(buf);
    };

    if (host) {
      server.on('connect', (conn: NetConnection) => {
        const state = getReplicatedState();
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
          dispatch({ type: NetReduxActionTypes.UPDATE });
          break;
        case NetActionTypes.UPDATE:
          const diffs = action.d as deepDiff.IDiff[];
          // apply diff to local state
          let state = clone(getState());
          diffs.forEach(diff => {
            deepDiff.applyChange(state, state, diff);
          });
          Object.assign(getState(), state);

          // TODO: Write a redux middleware to apply minimal changes of state tree.
          // Calling `clone` for each networked state update will be bad prob.

          // trigger update noop - forces rerender of applied diff
          dispatch({ type: NetReduxActionTypes.UPDATE });
          break;
      }
    });

    return (next: Dispatch<S>) => <A extends Action, B>(action: A): B | Action => {
      if (!host) {
        return next(<A>action);
      }

      const stateA = getState();
      const result = next(<A>action);
      const stateB = getState();

      const delta = deepDiff.diff(stateA, stateB, prefilter);

      if (delta && delta.length > 0) {
        console.log('[Net] netSyncMiddleware delta', delta);
        relay(delta);
        COMMIT_NUMBER++;
      }

      return result;
    };
  };
};
