import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux';
import { NetServer, NetConnection, localUser } from 'renderer/network';
import { actionCreator } from 'utils/redux';
import { Platform, ILobbyData } from 'renderer/platform/types';
import { PlatformService } from 'renderer/platform';

interface ISessionMiddlewareOptions {
  host: boolean;
}

export const setSessionData = actionCreator<ILobbyData>('session/SET_SESSION_DATA');

export const sessionMiddleware = (options: ISessionMiddlewareOptions): Middleware => {
  const { host } = options;

  return <S extends Object>(store: MiddlewareAPI<S>) => {
    const { dispatch, getState } = store;

    if (host) {
      const lobbyData = PlatformService.getLobbyData();

      if (lobbyData) {
        dispatch(setSessionData(lobbyData));
      }
    }

    return (next: Dispatch<S>) => <A extends Action, B>(action: A): B | Action => {
      return next(<A>action);
    };
  };
};
