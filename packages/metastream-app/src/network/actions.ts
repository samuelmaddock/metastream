import { actionCreator } from 'utils/redux'

import { NetServer, NetConnection } from 'network'
import { ReplicatedState } from 'network/types'

export interface NetMiddlewareOptions<T = any> {
  server?: NetServer
  host: boolean
  replicated: ReplicatedState<T>
}

export const NetActions = {
  connect: actionCreator<NetMiddlewareOptions>('NET_CONNECT'),
  disconnect: actionCreator<{ host: boolean }>('NET_DISCONNECT')
}
