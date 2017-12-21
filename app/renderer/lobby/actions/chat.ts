import { actionCreator } from 'utils/redux';
import { RpcThunk } from 'renderer/lobby/types';
import { getUserName } from 'renderer/lobby/reducers/users';
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc';
import { IMessage } from 'renderer/lobby/reducers/chat';
import { CHAT_MAX_MESSAGE_LENGTH } from 'constants/chat';

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

  if (text.length > CHAT_MAX_MESSAGE_LENGTH) {
    text = text.substr(0, CHAT_MAX_MESSAGE_LENGTH);
  }

  dispatch(multi_broadcastChat(userId, text));
};
export const server_addChat = rpc(RpcRealm.Server, rpcAddChat);
