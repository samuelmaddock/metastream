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

const rpcMap: { [key: string]: IRPCOptions } = {};

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
};

export const server_sendChatMessage = rpc('server', sendChatMessage);

/* TODO: how to send to specific client(s)?
client_addChat('76561197991989781')(msg);

multicast_addChat([
  '76561197991989781',
  '76561197991989782'
])(msg);

// Recipient filters? Player ID instead of social ID?
*/

/** RPC using classes and decorators */

// @RPC('Server')
class ServerSendChat {
  validate() {
    return true;
  }

  action() {
    console.log('foobar');
  }
}

/* Networked action creator
context => ({ type: 'action' }) // action creator
context => store => {...} // thunk

...args => context => [object | Function]

const server_addChat =
  (msg: string) =>
  (context: {role: 'client' | 'server', id: 'sam'}) =>
  (store: Redux.Store) => {
    // Implementation
  }
*/

/* STRING TABLES
   Register RPC names into a string table for easy lookup via integers
*/

/*
const state = {
  chat: [],

  // Replicated via decorator (not possible?)
  @Replicated
  players: []

  // Replicated via name
  rep_players: []
}

Could possibly parse TS code and generate code for the types using TSC
https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#using-the-type-checker

// Replication via types
interface IState {
  chat: string[],

  @Replicated
  players: IPlayer[]
}

// Manual
const replicationManifest = {
  players: true
}

OR

have a network update action and manually handle copying of updated
subtrees

e.g.
if (action.type === 'NetUpdate') {
  return {
    ...state,
    networkedProp: action.payload.networkedProp
    // ...
  }
}
*/

/*
actions
reducers
replicators

Replicators are responsible for describing when and what data to network using redux. Replicators should match the same structure as reducers

Can also handle responding to data changes.
  - Is this needed? We can handle data changing in components and such
*/
