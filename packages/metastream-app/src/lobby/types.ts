import { RpcThunkAction } from 'network/middleware/rpc'
import { IAppState } from 'reducers'

export type RpcThunk<R> = RpcThunkAction<R, IAppState>
