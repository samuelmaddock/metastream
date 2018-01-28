import { RpcThunkAction } from 'renderer/network/middleware/rpc';
import { IAppState } from 'renderer/reducers';

export type RpcThunk<R> = RpcThunkAction<R, IAppState>;
