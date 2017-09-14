import * as React from 'react';

import { Lobby } from 'components/Lobby';
import { IReactReduxProps } from 'types/redux';
import { IUsersState } from 'lobby/reducers/users';
import { server_addChat } from 'lobby/actions/chat';
import { netConnect, ILobbyNetState } from 'lobby';
import { getSessionName } from 'lobby/reducers/session';
import { VideoPlayer } from 'components/lobby/VideoPlayer';
import { IMediaItem, PlaybackState } from 'lobby/reducers/mediaPlayer';
import { isUrl } from 'utils/url';
import { server_requestMedia } from 'lobby/actions/mediaPlayer';
import { IMessage } from 'lobby/reducers/chat';
import { Messages } from 'components/chat/Messages';
import { Chat } from 'components/chat';

import styles from './GameLobby.css';
import { MediaItem } from 'components/media/MediaItem';
import { Link } from 'react-router-dom';

interface IProps {
  host: boolean;
}

interface IConnectedProps {
  currentMedia?: IMediaItem;
  messages: IMessage[];
  users: IUsersState;
  sessionName?: string;
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps;

const NO_MEDIA: IMediaItem = {
  title: 'No media playing',
  url: ''
};

class _GameLobby extends React.Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <div className={styles.container}>
        <section className={styles.browser}>
          <VideoPlayer />
        </section>
        <section className={styles.sidebar}>
          <header>
            <h3>{this.props.sessionName || 'Lobby'}</h3>
            <Link to="/servers">Leave</Link>
            <div>
              <h2>Users</h2>
              {Object.keys(this.props.users).map(userId => {
                return <div key={userId}>{this.props.users[userId]!.name}</div>;
              })}
            </div>
          </header>
          <MediaItem media={this.props.currentMedia || NO_MEDIA} />
          <Chat messages={this.props.messages} sendMessage={this.sendChat} />
        </section>
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
    currentMedia: state.mediaPlayer.current,
    messages: state.chat.messages,
    users: state.users,
    sessionName: getSessionName(state)
  };
})(_GameLobby);
