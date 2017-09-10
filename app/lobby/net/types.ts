import { RpcThunkAction } from "lobby/net/middleware/rpc";
import { ILobbyNetState } from "lobby/net/reducers";

export type RpcThunk<R> = RpcThunkAction<R, ILobbyNetState>;
