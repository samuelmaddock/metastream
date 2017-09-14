import { Reducer } from 'redux';
import { NetworkState } from 'types/network';
import { isType } from 'utils/redux';
import { addChat } from 'lobby/actions/chat';
import { setMedia, endMedia, playPauseMedia, nextMedia } from 'lobby/actions/mediaPlayer';
import { ILobbyNetState } from 'lobby/reducers';

export const enum PlaybackState {
  Idle,
  Playing,
  Paused
}

export interface IMediaItem {
  url: string;

  // TODO: Make the following non-optional
  title?: string;
  duration?: number;

  /** Thumbnail image */
  imageUrl?: string;

  /** Requester ID */
  ownerId?: string;

  /** Requester name, in case they disconnect */
  ownerName?: string;
}

export interface IMediaPlayerState {
  playback: PlaybackState;
  startTime?: number;
  current?: IMediaItem;
}

const initialState: IMediaPlayerState = {
  playback: PlaybackState.Idle
};

export const mediaPlayer: Reducer<IMediaPlayerState> = (
  state: IMediaPlayerState = initialState,
  action: any
) => {
  if (isType(action, setMedia)) {
    return {
      ...state,
      playback: PlaybackState.Playing,
      current: action.payload,
      startTime: Date.now()
    };
  } else if (isType(action, endMedia)) {
    return { ...state, playback: PlaybackState.Idle, current: undefined, startTime: undefined };
  } else if (isType(action, playPauseMedia)) {
    let newPlayback;

    switch (state.playback) {
      case PlaybackState.Playing:
        newPlayback = PlaybackState.Paused;
        break;
      case PlaybackState.Paused:
        newPlayback = PlaybackState.Playing;
        break;
    }

    if (newPlayback) {
      return { ...state, playback: newPlayback };
    }
  } else if (isType(action, nextMedia)) {
    return { ...state, playback: PlaybackState.Idle, current: undefined, startTime: undefined };
  }

  return state;
};
