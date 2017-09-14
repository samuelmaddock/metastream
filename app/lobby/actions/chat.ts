import { actionCreator } from 'utils/redux';
import { RpcThunk } from 'lobby/types';
import { getUserName } from 'lobby/reducers/users';
import { rpc, RpcRealm } from 'network/middleware/rpc';
import { IMessage } from 'lobby/reducers/chat';

export const addChat = actionCreator<IMessage>('ADD_CHAT');

const broadcastChat = (userId: string, text: string): RpcThunk<void> => (
  dispatch,
  getState,
  context
) => {
  dispatch(
    addChat({
      author: {
        id: userId,
        username: getUserName(getState(), userId)
      },
      content: text,
      timestamp: Date.now()
    })
  );
};
export const multi_broadcastChat = rpc(RpcRealm.Multicast, broadcastChat);

const rpcAddChat = (text: string): RpcThunk<void> => (dispatch, getState, context) => {
  const userId = context.client.id.toString();

  dispatch(multi_broadcastChat(userId, text));
};
export const server_addChat = rpc(RpcRealm.Server, rpcAddChat);
