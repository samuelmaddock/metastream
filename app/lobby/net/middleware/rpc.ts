import { Middleware, MiddlewareAPI, Action, Dispatch } from "redux";
import { NetServer, NetConnection } from "lobby/types";

const RpcReduxActionTypes = {
  DISPATCH: '@@rpc/DISPATCH'
}

type RpcMiddlewareResult = boolean;

export interface NetRpcMiddlewareOptions {
  server: NetServer;
  host: boolean;
}

const RPC_HEADER = 'RPC';

export const netRpcMiddleware = (options: NetRpcMiddlewareOptions): Middleware => {
  const { server, host } = options;
  console.log('[RPC] Init middleware', options);

  return <S extends Object>(store: MiddlewareAPI<S>) => {
    const {dispatch, getState} = store;

    // Dispatch RPCs
    server.on('data', (conn: NetConnection, data: Buffer) => {
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

      console.info(`[RPC] Received RPC '#${action.type}' from ${conn.id}`, action);

      dispatchRpc(action);
    });

    const sendRpc = ({payload}: RpcAction) => {
      const rpc = getRpc(payload.name)!;

      const json = JSON.stringify(payload);
      const buf = new Buffer(RPC_HEADER + json);

      if (rpc.realm === RpcRealm.Server) {
        server.sendToHost(buf);
      }
    };

    const dispatchRpc = (action: RpcAction) => {
      const result = execRpc(action);

      if (typeof result === 'function') {
        // net thunk
        result(dispatch, getState);
      } else if (typeof result === 'object') {
        dispatch(result as Action);
      }
    };

    return (next: Dispatch<S>) => <A extends RpcAction>(action: A): Action|RpcMiddlewareResult => {
      // TODO: check for RPC special prop
      if (action.type !== RpcReduxActionTypes.DISPATCH) {
        return next(action);
      }

      console.log('RPC middleware', action);

      const rpcName = action.payload.name;
      const rpc = getRpc(rpcName);

      if (!rpc) {
        throw new Error(`[RPC] Attempted to dispatch unknown RPC '${rpcName}'`);
      }

      switch (rpc.realm) {
        case RpcRealm.Server:
          if (options.host) {
            dispatchRpc(action);
          } else {
            sendRpc(action);
          }
          break;
        default:
          sendRpc(action);
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
    args: any[]
  }
}

interface IRPCOptions {
	realm: RpcRealm;
	action: (...args: any[]) => void;
	validate?: (...args: any[]) => boolean;
}

const rpcMap: {[key: string]: IRPCOptions | undefined} = {};

const getRpc = (name: string) => rpcMap[name];

const execRpc = <T>({payload}: RpcAction): T => {
  const {name, args} = payload;

  if (!rpcMap.hasOwnProperty(name)) {
    throw new Error(`Unknown RPC received for "${name}"`);
  }

  const opts = rpcMap[name]!;

  if (opts.validate && !opts.validate(args)) {
    throw new Error(`Invalidate arguments for RPC "${name}"`);
  }

  return opts.action.apply(null, args);
};

export const rpc = (
	realm: RpcRealm,
	action: (...args: any[]) => void,
	validate?: (...args: any[]) => boolean
): Function => {
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
	return (...args: any[]) => ({
		type: RpcReduxActionTypes.DISPATCH,
		payload: {
			name: name,
			args: args
		}
	} as RpcAction);
};
