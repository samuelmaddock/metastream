import { RpcThunkAction } from 'network/middleware/rpc'
import { IAppState } from 'reducers'
import { ExtraContext } from 'store/types'

export type RpcThunk<R> = RpcThunkAction<R, IAppState, ExtraContext>
