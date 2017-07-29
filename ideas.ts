/*
Steam Matchmaking Lobby
↳ WebRTC Lobby
  ↳ Game Lobby
↳ WebSocket Lobby
  ↳ Game Lobby
Electron Local Lobby
↳ WebRTC, Websocket Lobby, etc.
  ↳ ...
*/

const dispatch: any = () => {};
type Thunk<T> = any;

interface IRPCOptions {
	realm: 'client' | 'server' | 'multicast';
	action: (...args: any[]) => void;
	validate?: (...args: any[]) => boolean;
}

const rpcMap: {[key: string]: IRPCOptions} = {};

export const execRpc = (name: string, ...args: any[]): void => {
  if (!rpcMap.hasOwnProperty(name)) {
    throw new Error(`Unknown RPC received for "${name}"`);
  }

  const opts = rpcMap[name];

  if (opts.validate && !opts.validate(args)) {
    throw new Error(`Invalidate arguments for RPC "${name}"`);
  }

  dispatch(opts.action.apply(null, args));
};

export const rpc = (
	realm: 'client' | 'server' | 'multicast',
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
		type: '@@RPC',
		rpc: {
			name: name,
			args: args
		}
	});
};

/** Usage example */
const sendChatMessage = (msg: string): Thunk<void> => {
  return (dispatch: any, getState: any): void => {
    // ...
  };
}

export const server_sendChatMessage = rpc('server', sendChatMessage);

// TODO: how to send to specific client?
// client_addChat('76561197991989781')(msg);
