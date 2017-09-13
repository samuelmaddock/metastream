import * as React from 'react';

import { Lobby } from 'components/Lobby';
import { IReactReduxProps } from 'types/redux';
import { IChatEntry } from 'lobby/reducers/chat';
import { IUsersState } from 'lobby/reducers/users';
import { server_addChat } from 'lobby/actions/chat';
import { netConnect, ILobbyNetState } from 'lobby';
import { getSessionName } from 'lobby/reducers/session';
import { VideoPlayer } from 'components/lobby/VideoPlayer';
import { IMediaItem } from 'lobby/reducers/mediaPlayer';
import { isUrl } from 'utils/url';
import { server_requestMedia } from 'lobby/actions/mediaPlayer';

interface IProps {
  host: boolean;
}

interface IConnectedProps {
  chat: IChatEntry[];
  currentMedia?: IMediaItem;
  mediaStartTime?: number;
  users: IUsersState;
  sessionName?: string;
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps;

class _GameLobby extends React.Component<PrivateProps> {
  render(): JSX.Element {
    const { currentMedia, mediaStartTime } = this.props;

    return (
      <div>
        <VideoPlayer media={currentMedia} startTime={mediaStartTime} />
        <Lobby
          name={this.props.sessionName || 'Connecting'}
          messages={this.props.chat}
          sendMessage={this.sendChat}
        />
        <h2>Users</h2>
        {Object.keys(this.props.users).map(userId => {
          return <div key={userId}>{this.props.users[userId]!.name}</div>;
        })}
      </div>
    );
  }

  private sendChat = (text: string): void => {
    if (isUrl(text)) {
      this.props.dispatch(server_requestMedia(text));
    } else {
      this.props.dispatch(server_addChat(text));
    }
  };
}

export const GameLobby = netConnect<{}, {}, IProps>((state: ILobbyNetState): IConnectedProps => {
  return {
    chat: state.chat.entries,
    currentMedia: state.mediaPlayer.current,
    mediaStartTime: state.mediaPlayer.startTime,
    users: state.users,
    sessionName: getSessionName(state)
  };
})(_GameLobby);
