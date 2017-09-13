import { actionCreator } from 'utils/redux';
import { IMediaItem } from 'lobby/reducers/mediaPlayer';
import { Thunk } from 'types/thunk';
import { ThunkAction } from 'redux-thunk';
import { ILobbyNetState } from 'lobby';
import { rpc, RpcRealm } from 'network/middleware/rpc';
import { RpcThunk } from 'lobby/types';
import { PlatformService } from 'platform';

export const setMedia = actionCreator<IMediaItem>('SET_MEDIA');
export const endMedia = actionCreator<void>('END_MEDIA');

const requestMedia = (url: string): RpcThunk<void> => (dispatch, getState, context) => {
  const userId = context.client.id;
  const media: IMediaItem = {
    url,
    title: 'Unknown',
    duration: -1,
    ownerId: userId.toString(),
    ownerName: PlatformService.getUserName(userId)
  };

  dispatch(setMedia(media));
};
export const server_requestMedia = rpc(RpcRealm.Server, requestMedia);
