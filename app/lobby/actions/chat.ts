import { actionCreator } from 'utils/redux';
import { RpcThunk } from 'lobby/types';
import { getUserName } from 'lobby/reducers/users';
import { rpc, RpcRealm } from 'network/middleware/rpc';
import { isUrl } from 'utils/url';
import { requestMedia } from 'lobby/actions/mediaPlayer';

export const addChat = actionCreator<{
  sender: string;
  name: string;
  message: string;
}>('ADD_CHAT');

const broadcastChat = (userId: string, text: string): RpcThunk<void> => (
  dispatch,
  getState,
  context
) => {
  dispatch(
    addChat({
      sender: userId,
      name: getUserName(getState(), userId),
      message: text
    })
  );
};
export const multi_broadcastChat = rpc(RpcRealm.Multicast, broadcastChat);

const rpcAddChat = (text: string): RpcThunk<void> => (dispatch, getState, context) => {
  const userId = context.client.id.toString();

  if (isUrl(text)) {
    if (dispatch(requestMedia(text))) {
      return;
    }
  }

  dispatch(multi_broadcastChat(userId, text));
};
export const server_addChat = rpc(RpcRealm.Server, rpcAddChat);
