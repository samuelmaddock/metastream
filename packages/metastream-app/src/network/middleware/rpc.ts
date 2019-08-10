import { Middleware, MiddlewareAPI, Action, Dispatch, AnyAction } from 'redux'
import { ActionCreator } from 'redux'

import { NetConnection, NetServer, localUser, localUserId } from 'network'
import { NetMiddlewareOptions, NetActions } from 'network/actions'
import { isType } from 'utils/redux'
import { initLobby } from '../../lobby/actions/common'
import { ThunkDispatch } from 'redux-thunk'

let RPC_UID = 1

const remoteResultListeners: { [id: number]: Set<Function> | undefined } = {}

const addResultListener = (id: number, cb: Function) => {
  const set = remoteResultListeners[id] || (remoteResultListeners[id] = new Set())
  set.add(cb)
}

const removeResultListener = (id: number, cb: Function) => {
  const set = remoteResultListeners[id]
  if (set && set.has(cb)) {
    set.delete(cb)
  }
}

const dispatchResultListeners = (id: number, result: any) => {
  console.debug(`[RPC][${id}] Received result`, result)
  const set = remoteResultListeners[id]
  if (set) {
    Array.from(set).forEach(cb => cb(result))
    remoteResultListeners[id] = undefined
  }
}

const RpcReduxActionTypes = {
  DISPATCH: '@@rpc/DISPATCH'
}

type RpcMiddlewareResult = boolean

interface IRpcThunkContext {
  client: NetConnection
  host: boolean
  server: NetServer
}

export type RpcThunkAction<R, S> = (
  dispatch: ThunkDispatch<S, IRpcThunkContext, AnyAction>,
  getState: () => S,
  context: IRpcThunkContext
) => R

const isRpcThunk = (arg: any): arg is RpcThunkAction<any, any> => typeof arg === 'function'

export interface NetRpcMiddlewareOptions {
  server: NetServer
  host: boolean
}

const RPC_HEADER = 'RPC'

const enum RpcMessageType {
  Exec,
  Result
}

type RpcJson =
  | {
      type: RpcMessageType.Exec
      id: number
      name: string
      args: any[]
    }
  | {
      type: RpcMessageType.Result
      id: number
      result: any
    }

export const netRpcMiddleware = (): Middleware => {
  return store => {
    const { dispatch, getState } = store

    let server: NetServer | null, host: boolean

    const init = (options: NetMiddlewareOptions) => {
      console.debug('[RPC] Init middleware', options)

      server = options.server || null
      host = options.host

      if (server) {
        // Listen for RPCs and dispatch them
        server.on('data', receive)
      }
    }

    const destroy = () => {
      server = null
    }

    const receive = async (client: NetConnection, data: Buffer) => {
      if (data.indexOf(RPC_HEADER) !== 0) {
        return
      }

      const jsonStr = data.toString('utf-8', RPC_HEADER.length)
      const json = JSON.parse(jsonStr) as RpcJson

      if (json.type === RpcMessageType.Exec) {
        const payload = {
          id: json.id,
          name: json.name,
          args: json.args
        }

        const action = {
          type: RpcReduxActionTypes.DISPATCH,
          payload
        }

        console.debug(`[RPC][${client.shortId}][${json.id}] ${json.name}`, ...json.args)

        let returnValue
        try {
          returnValue = await dispatchRpc(action, client)
        } catch (e) {
          console.error(e)
          return
        }

        if (typeof returnValue !== 'undefined') {
          sendRpcResult(action.payload.id, returnValue, client)
        }
      } else if (json.type === RpcMessageType.Result) {
        dispatchResultListeners(json.id, json.result)
      }
    }

    /** Send RPC to recipients. */
    const sendRpc = (action: RpcAction) => {
      if (!server) return

      const { payload, clients } = action
      const rpc = getRpc(payload.name)!

      const msg: RpcJson = { type: RpcMessageType.Exec, ...payload }
      const json = JSON.stringify(msg)
      const buf = new Buffer(RPC_HEADER + json)

      switch (rpc.realm) {
        case RpcRealm.Server:
          server.sendToHost(buf)
          break
        case RpcRealm.Multicast:
          server.send(buf)
          break
        case RpcRealm.Client:
          clients!.forEach(clientId => {
            if (clientId === localUserId()) {
              dispatchRpc(action, localUser())
            } else {
              server!.sendTo(clientId, buf)
            }
          })
          break
      }
    }

    const sendRpcResult = (id: number, result: any, client: NetConnection) => {
      const payload: RpcJson = { type: RpcMessageType.Result, id, result }
      const json = JSON.stringify(payload)
      const buf = new Buffer(RPC_HEADER + json)
      client.send(buf)
    }

    /** Dispatch RPC on local Redux store. */
    const dispatchRpc = (action: RpcAction, client: NetConnection) => {
      const result = execRpc(action, client)

      if (isRpcThunk(result)) {
        // TODO: update IRpcThunkContext to reflect possibly undefined server
        // when user is in offline session
        const context = { client, host, server: server! }
        return result(dispatch, getState, context)
      } else if (typeof result === 'object') {
        dispatch(result as Action)
      } else if (typeof result === 'string') {
        console.error(result)
      }
    }

    return next => <A extends RpcAction>(action: A): Action | RpcMiddlewareResult => {
      if (isType(action, initLobby)) {
        host = action.payload.host
      } else if (isType(action, NetActions.connect)) {
        init(action.payload)
        return next(<A>action)
      } else if (isType(action, NetActions.disconnect)) {
        destroy()
        return next(<A>action)
      }

      // TODO: check for RPC special prop
      if (action.type !== RpcReduxActionTypes.DISPATCH) {
        return next(action)
      }

      const rpcName = action.payload.name
      const rpc = getRpc(rpcName)

      if (!rpc) {
        throw new Error(`[RPC] Attempted to dispatch unknown RPC '${rpcName}'`)
      }

      // TODO: send result back if received from peer
      // TODO: return proxy promise when remote dispatched
      let asyncResult = false

      // https://docs.unrealengine.com/latest/INT/Gameplay/Networking/Actors/RPCs/#rpcinvokedfromtheserver
      switch (rpc.realm) {
        case RpcRealm.Server:
          // SERVER: dispatch
          // CLIENT: send to server
          if (host) {
            return dispatchRpc(action, localUser()) as any
          } else {
            sendRpc(action)
            asyncResult = true
          }
          break
        case RpcRealm.Client:
          // SERVER: dispatch
          // CLIENT: throw
          if (host) {
            sendRpc(action)
            asyncResult = true
          } else {
            throw new Error(`Client RPC '${action.type}' dispatched on client`)
          }
          break
        case RpcRealm.Multicast:
          // SERVER: broadcast and dispatch
          // CLIENT: dispatch
          if (host) {
            sendRpc(action)
          }
          dispatchRpc(action, localUser())
          break
      }

      if (asyncResult) {
        return {
          then(resolve: Function, reject: Function) {
            let timeoutId = -1

            const cb = (...args: any[]) => {
              clearTimeout(timeoutId)
              resolve(...args)
            }
            addResultListener(action.payload.id, cb)

            timeoutId = (setTimeout(() => {
              removeResultListener(action.payload.id, cb)
              reject('Timeout')
            }, 5000) as any) as number
          }
        } as any
      }

      return true
    }
  }
}

//
// RPC FUNCTION WRAPPER
//

export const enum RpcRealm {
  Server = 'server',
  Client = 'client',
  Multicast = 'multicast'
}

type RecipientFilter = string[]

interface RpcAction extends Action {
  clients?: RecipientFilter
  payload: {
    /** Unique RPC ID. */
    id: number

    /** Remote RPC function name. */
    name: string
    args: any[]
  }
}

interface IRPCOptions {
  validate?: (...args: any[]) => boolean

  /** Allows processing of RPC from unauthorized user. */
  allowUnauthed?: boolean
}

interface IRPC extends IRPCOptions {
  realm: RpcRealm
  action: Function
}

const rpcMap: { [key: string]: IRPC | undefined } = {}

const getRpc = (name: string) => rpcMap[name]

const execRpc = <T>({ payload }: RpcAction, client: NetConnection): T | string => {
  const { name, args } = payload

  if (!rpcMap.hasOwnProperty(name)) {
    throw new Error(`Exec unknown RPC "${name}"`)
  }

  const opts = rpcMap[name]!

  if (!client.isAuthed() && !opts.allowUnauthed) {
    return `Client not authorized to dispatch RPC "${name}"`
  }

  if (opts.validate && !opts.validate(args)) {
    return `Invalidate arguments for RPC "${name}"`
  }

  return opts.action.apply(null, args)
}

// prettier-ignore
export function rpc<TResult>(name: string, realm: RpcRealm.Multicast | RpcRealm.Server, action: () => TResult, opts?: IRPCOptions): (() => TResult);
// prettier-ignore
export function rpc<T1, TResult>(name: string, realm: RpcRealm.Multicast | RpcRealm.Server, action: (a: T1) => TResult, opts?: IRPCOptions): ((a: T1) => TResult);
// prettier-ignore
export function rpc<T1, T2, TResult>(name: string, realm: RpcRealm.Multicast | RpcRealm.Server, action: (a: T1, b: T2) => TResult, opts?: IRPCOptions): ((a: T1, b: T2) => TResult);
// prettier-ignore
export function rpc<T1, T2, T3, TResult>(name: string, realm: RpcRealm.Multicast | RpcRealm.Server, action: (a: T1, b: T2, c: T3) => TResult, opts?: IRPCOptions): ((a: T1, b: T2, c: T3) => TResult);
// prettier-ignore
export function rpc<TResult>(name: string, realm: RpcRealm.Client, action: () => TResult, opts?: IRPCOptions): (() => (...clients: RecipientFilter) => TResult);
// prettier-ignore
export function rpc<T1, TResult>(name: string, realm: RpcRealm.Client, action: (a: T1) => TResult, opts?: IRPCOptions): ((a: T1) => (...clients: RecipientFilter) => TResult);
// prettier-ignore
export function rpc<T1, T2, TResult>(name: string, realm: RpcRealm.Client, action: (a: T1, b: T2) => TResult, opts?: IRPCOptions): ((a: T1, b: T2) => (...clients: RecipientFilter) => TResult);
// prettier-ignore
export function rpc<T1, T2, T3, TResult>(name: string, realm: RpcRealm.Client, action: (a: T1, b: T2, c: T3) => TResult, opts?: IRPCOptions): ((a: T1, b: T2, c: T3) => (...clients: RecipientFilter) => TResult);
// prettier-ignore
export function rpc(name: string, realm: RpcRealm, action: (...args: any[]) => any, opts?: IRPCOptions): Function {
  if (name === 'action') {
    throw new Error('Invalid RPC action name, must define function name.')
  }

  // Register global RPC handler
  if (rpcMap.hasOwnProperty(name)) {
    console.warn(`RPC action name ("${name}") collides with existing action, overriding...`)
  }

  rpcMap[name] = { ...opts, realm, action }

  // Return Redux action creator;
  // intercepted by redux-rpc middleware
  let proxy

  if (realm === RpcRealm.Client) {
    proxy = (...args: any[]) => (...clients: RecipientFilter) =>
      ({
        type: RpcReduxActionTypes.DISPATCH,
        clients,
        payload: {
          id: RPC_UID++,
          name: name,
          args: args
        },
      } as RpcAction)
  } else {
    proxy = (...args: any[]) =>
      ({
        type: RpcReduxActionTypes.DISPATCH,
        payload: {
          id: RPC_UID++,
          name: name,
          args: args
        }
      } as RpcAction)
  }

  return proxy
}
