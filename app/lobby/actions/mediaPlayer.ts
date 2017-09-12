import { actionCreator } from 'utils/redux';
import { IMediaItem } from 'lobby/reducers/mediaPlayer';
import { Thunk } from 'types/thunk';
import { ThunkAction } from 'redux-thunk';
import { ILobbyNetState } from 'lobby';

export const setMedia = actionCreator<IMediaItem>('SET_MEDIA');
export const endMedia = actionCreator<void>('END_MEDIA');

export const requestMedia = (url: string): ThunkAction<boolean, ILobbyNetState, void> => {
  return (dispatch, getState) => {
    // TODO: Process request
    dispatch(setMedia({ url }));
    return true;
  };
};
