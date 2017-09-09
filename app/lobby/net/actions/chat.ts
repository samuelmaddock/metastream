import { actionCreator } from "utils/redux";
import { rpc, RpcRealm } from "lobby/net/middleware/rpc";

/** Test action to add a chat message */
export const addChat = actionCreator<string>('ADD_CHAT');


const rpcAddChat = (msg: string) => (dispatch: any, getState: any, context: any) => {
  console.log('rpcAddChat called', msg, context);
  dispatch(addChat(msg));
};
export const server_addChat = rpc(RpcRealm.Server, rpcAddChat);
