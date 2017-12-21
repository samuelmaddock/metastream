import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux';
import { actionCreator } from 'utils/redux';
import { Platform } from 'renderer/platform/types';
import { PlatformService } from 'renderer/platform';
import { localUser, NetConnection, NetServer } from 'renderer/network';

export interface NetMiddlewareOptions {
  server: NetServer;
  host: boolean;
}

interface IUserPayload {
  conn: NetConnection;
  name: string;
}

export const addUser = actionCreator<IUserPayload>('ADD_USER');
export const removeUser = actionCreator<string>('REMOVE_USER');

export const usersMiddleware = (options: NetMiddlewareOptions): Middleware => {
  const { server, host } = options;

  return <S extends Object>(store: MiddlewareAPI<S>) => {
    const { dispatch, getState } = store;

    if (host) {
      // Add local user as initial user
      dispatch(
        addUser({
          conn: localUser(),
          name: PlatformService.getUserName(localUser().id)
        })
      );

      server.on('connect', (conn: NetConnection) => {
        dispatch(
          addUser({
            conn,
            name: PlatformService.getUserName(conn.id)
          })
        );
      });

      server.on('disconnect', (conn: NetConnection) => {
        dispatch(removeUser(conn.id.toString()));
      });
    }

    return (next: Dispatch<S>) => <A extends Action, B>(action: A): B | Action => {
      return next(<A>action);
    };
  };
};
