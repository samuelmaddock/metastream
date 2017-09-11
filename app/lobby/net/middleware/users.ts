import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux';
import { NetServer, NetConnection } from 'lobby/types';
import { actionCreator } from 'utils/redux';
import { Platform } from 'platform/types';
import { PlatformService } from 'platform';
import { localUser } from 'lobby/net/localhost';

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
