import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux';
import { NetServer, NetConnection } from 'lobby/types';
import { actionCreator } from 'utils/redux';
import { Platform, ILobbyData } from 'platform/types';
import { PlatformService } from 'platform';
import { localUser } from 'lobby/net/localhost';

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
