import { Middleware, MiddlewareAPI, Action, Dispatch } from "redux";
import deepDiff from 'deep-diff';

export const netSyncMiddleware: Middleware =
  <S extends Object>({dispatch, getState}: MiddlewareAPI<S>) =>
  (next: Dispatch<S>) =>
  <A extends Action, B>(action: A): B|Action => {
    const stateA = getState();
    console.log('netSyncMiddleware 1', action, stateA);
    const result = next(<A>action);
    const stateB = getState();
    const delta = deepDiff.diff(stateA, stateB);
    console.log('netSyncMiddleware 2', stateB);
    console.log('netSyncMiddleware delta', delta);
    return result;
  };
