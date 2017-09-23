import { Middleware, MiddlewareAPI, Action, Dispatch } from 'redux';
import { ActionCreator } from 'redux';

import { NetConnection, NetServer, localUser } from 'network';

const RpcReduxActionTypes = {
  DISPATCH: '@@rpc/DISPATCH'
};

type RpcMiddlewareResult = boolean;

interface IRpcThunkContext {
  client: NetConnection;
}

export type RpcThunkAction<R, S> = (
  dispatch: Dispatch<S>,
  getState: () => S,
  context: IRpcThunkContext
) => R;

const isRpcThunk = (arg: any): arg is RpcThunkAction<any, any> => typeof arg === 'function';

export interface NetRpcMiddlewareOptions {
  server: NetServer;
  host: boolean;
}

const RPC_HEADER = 'RPC';

export const netRpcMiddleware = (options: NetRpcMiddlewareOptions): Middleware => {
  const { server, host } = options;
  console.log('[RPC] Init middleware', options);

  return <S extends Object>(store: MiddlewareAPI<S>) => {
    const { dispatch, getState } = store;

    // Listen for RPCs and dispatch them
    server.on('data', (client: NetConnection, data: Buffer) => {
      if (data.indexOf(RPC_HEADER) !== 0) {
        return;
      }

      const jsonStr = data.toString('utf-8', RPC_HEADER.length);
      const json = JSON.parse(jsonStr);

      const action = {
        type: RpcReduxActionTypes.DISPATCH,
        payload: {
          name: json.name,
          args: json.args
        }
      };

      console.info(`[RPC] Received RPC '#${action.type}' from ${client.id}`, action);

      dispatchRpc(action, client);
    });

    /** Send RPC to recipients. */
    const sendRpc = ({ payload }: RpcAction) => {
      const rpc = getRpc(payload.name)!;

      const json = JSON.stringify(payload);
      const buf = new Buffer(RPC_HEADER + json);

      switch (rpc.realm) {
        case RpcRealm.Server:
          server.sendToHost(buf);
          break;
        case RpcRealm.Multicast:
          server.send(buf);
          break;
        default:
          throw new Error('Not yet implemented');
      }
    };

    /** Dispatch RPC on local Redux store. */
    const dispatchRpc = (action: RpcAction, client: NetConnection) => {
      const result = execRpc(action);

      if (isRpcThunk(result)) {
        const context = { client };
        result(dispatch, getState, context);
      } else if (typeof result === 'object') {
        dispatch(result as Action);
      }
    };

    return (next: Dispatch<S>) => <A extends RpcAction>(
      action: A
    ): Action | RpcMiddlewareResult => {
      // TODO: check for RPC special prop
      if (action.type !== RpcReduxActionTypes.DISPATCH) {
        return next(action);
      }

      const rpcName = action.payload.name;
      const rpc = getRpc(rpcName);

      if (!rpc) {
        throw new Error(`[RPC] Attempted to dispatch unknown RPC '${rpcName}'`);
      }

      // https://docs.unrealengine.com/latest/INT/Gameplay/Networking/Actors/RPCs/#rpcinvokedfromtheserver
      switch (rpc.realm) {
        case RpcRealm.Server:
          // SERVER: dispatch
          // CLIENT: send to server
          if (options.host) {
            dispatchRpc(action, localUser());
          } else {
            sendRpc(action);
          }
          break;
        case RpcRealm.Client:
          throw new Error('[RPC] Client RPCs not yet implemented');
        case RpcRealm.Multicast:
          // SERVER: broadcast and dispatch
          // CLIENT: dispatch
          if (options.host) {
            sendRpc(action);
          }
          dispatchRpc(action, localUser());
          break;
      }

      return true;
    };
  };
};

//
// RPC FUNCTION WRAPPER
//

export const enum RpcRealm {
  Server = 'server',
  Client = 'client',
  Multicast = 'multicast'
}

interface RpcAction extends Action {
  payload: {
    name: string;
    args: any[];
  };
}

interface IRPCOptions {
  realm: RpcRealm;
  action: Function;
  validate?: (...args: any[]) => boolean;
}

const rpcMap: { [key: string]: IRPCOptions | undefined } = {};

const getRpc = (name: string) => rpcMap[name];

const execRpc = <T>({ payload }: RpcAction): T => {
  const { name, args } = payload;

  if (!rpcMap.hasOwnProperty(name)) {
    throw new Error(`Exec unknown RPC "${name}"`);
  }

  const opts = rpcMap[name]!;

  if (opts.validate && !opts.validate(args)) {
    throw new Error(`Invalidate arguments for RPC "${name}"`);
  }

  return opts.action.apply(null, args);
};

export const rpc = <T extends Function>(
  realm: RpcRealm,
  action: T,
  validate?: (...args: any[]) => boolean
): ActionCreator<any> => {
  const { name } = action;

  if (name === 'action') {
    throw new Error('Invalid RPC action name, must define function name.');
  }

  // Register global RPC handler
  if (rpcMap.hasOwnProperty(name)) {
    throw new Error(`RPC action name ("${name}") collides with existing action`);
  }

  rpcMap[name] = { realm, action, validate };

  // Return Redux action creator;
  // intercepted by redux-rpc middleware
  const proxy = (...args: any[]) =>
    ({
      type: RpcReduxActionTypes.DISPATCH,
      payload: {
        name: name,
        args: args
      }
    } as RpcAction);

  return proxy as ActionCreator<any>;
};
