import { RpcThunkAction } from 'renderer/network/middleware/rpc';
import { ILobbyNetState } from './reducers';

export type RpcThunk<R> = RpcThunkAction<R, ILobbyNetState>;
