import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux';
import { actionCreator, isType } from 'utils/redux';
import { Platform } from 'renderer/platform/types';
import { PlatformService } from 'renderer/platform';
import { localUser, NetConnection, NetServer } from 'renderer/network';
import { NetMiddlewareOptions, NetActions } from 'renderer/network/actions';

interface IUserPayload {
  conn: NetConnection;
  name: string;
}

export const addUser = actionCreator<IUserPayload>('ADD_USER');
export const removeUser = actionCreator<string>('REMOVE_USER');

export const usersMiddleware = (): Middleware => {
  return <S extends Object>(store: MiddlewareAPI<S>) => {
    const { dispatch, getState } = store;

    let server: NetServer | null, host: boolean

    const init = (options: NetMiddlewareOptions) => {
      server = options.server
      host = options.host

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
    }

    const destroy = () => {
      server = null
      host = false
    }

    return (next: Dispatch<S>) => <A extends Action, B>(action: A): B | Action => {
      if (!server) {
        if (isType(action, NetActions.connect)) {
          init(action.payload)
        } else if (isType(action, NetActions.disconnect)) {
          destroy()
        }
        return next(<A>action);
      }

      return next(<A>action);
    };
  };
};
