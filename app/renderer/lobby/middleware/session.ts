import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux';
import { NetServer, NetConnection, localUser } from 'renderer/network';
import { actionCreator } from 'utils/redux';
import { Platform } from 'renderer/platform/types';
import { PlatformService } from 'renderer/platform';

interface ISessionMiddlewareOptions {
  host: boolean;
}
export const sessionMiddleware = (): Middleware => {
  return <S extends Object>(store: MiddlewareAPI<S>) => {
    const { dispatch, getState } = store;

    const init = (options: ISessionMiddlewareOptions) => {
      if (options.host) {
        // TODO
      }
    }

    return (next: Dispatch<S>) => <A extends Action, B>(action: A): B | Action => {
      return next(<A>action);
    };
  };
};
