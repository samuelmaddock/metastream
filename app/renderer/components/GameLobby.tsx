import React from 'react';
import { DispatchProp, connect } from 'react-redux';
import cx from 'classnames';
const { ipcRenderer } = chrome;

import { Lobby } from 'renderer/components/Lobby';
import { IReactReduxProps } from 'types/redux';
import { IUsersState } from 'renderer/lobby/reducers/users';
import { server_addChat } from 'renderer/lobby/actions/chat';
import { getSessionName } from 'renderer/lobby/reducers/session';
import { VideoPlayer } from 'renderer/components/lobby/VideoPlayer';
import { IMediaItem, PlaybackState } from 'renderer/lobby/reducers/mediaPlayer';
import { isUrl } from 'utils/url';
import {
  server_requestMedia,
  server_requestPlayPause,
  server_requestNextMedia,
  server_requestSeek
} from 'renderer/lobby/actions/mediaPlayer';
import { IMessage } from 'renderer/lobby/reducers/chat';
import { Messages } from 'renderer/components/chat/Messages';
import { Chat } from 'renderer/components/chat';

import styles from './GameLobby.css';
import { UserItem } from 'renderer/components/lobby/UserItem';
import { MediaItem } from 'renderer/components/media/MediaItem';
import { Link } from 'react-router-dom';
import {
  getCurrentMedia,
  getMediaQueue,
  getPlaybackState
} from 'renderer/lobby/reducers/mediaPlayer.helpers';
import { ListOverlay } from 'renderer/components/lobby/ListOverlay';
import { TitleBar } from 'renderer/components/TitleBar';
import { PlaybackControls } from 'renderer/components/media/PlaybackControls';
import { setVolume } from 'renderer/actions/settings';
import { ActivityMonitor } from 'renderer/components/lobby/ActivityMonitor';
import { MediaType } from 'renderer/media/types';
import { WebBrowser } from 'renderer/components/browser/WebBrowser';
import { Icon } from 'renderer/components/Icon';
import { registerMediaShortcuts, unregisterMediaShortcuts } from 'renderer/lobby/actions/shortcuts';
import { isUpdateAvailable } from 'renderer/reducers/ui';
import { IAppState } from 'renderer/reducers';

interface IProps {
  host: boolean;
}

interface IState {
  inactive: boolean;
  showBrowser?: boolean;
}

interface IConnectedProps {
  currentMedia?: IMediaItem;
  mediaQueue: IMediaItem[];
  messages: IMessage[];
  playback: PlaybackState;
  users: IUsersState;
  sessionName?: string;
  updateAvailable: boolean;
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>;

const NO_MEDIA: IMediaItem = {
  type: MediaType.Item,
  title: 'No media playing',
  url: '',
  requestUrl: ''
};

class _GameLobby extends React.Component<PrivateProps, IState> {
  private player: VideoPlayer | null;

  private get isInactive() {
    return this.state.inactive && this.props.playback === PlaybackState.Playing;
  }

  state: IState = { inactive: false };

  componentDidMount() {
    ipcRenderer.on('command', this.onWindowCommand);
    this.props.dispatch!(registerMediaShortcuts());
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('command', this.onWindowCommand);
    this.props.dispatch!(unregisterMediaShortcuts());
  }

  render(): JSX.Element {
    const { currentMedia: media } = this.props;
    const userIds = Object.keys(this.props.users);
    return (
      <div
        className={cx(styles.container, {
          lobbyInactive: this.isInactive,
          browserVisible: this.state.showBrowser
        })}
      >
        <VideoPlayer
          theRef={el => {
            this.player = el;
          }}
          className={styles.video}
        />
        {this.renderPlaybackControls()}
        <TitleBar className={styles.titlebar} title={media && media.title} />
        <ListOverlay className={styles.users} title="Users" tagline={`${userIds.length} online`}>
          {userIds.map((userId: string) => {
            const user = this.props.users[userId]!;
            return <UserItem key={userId} user={user} />;
          })}
        </ListOverlay>
        <ListOverlay
          className={styles.queue}
          title="Next up"
          tagline={`${this.props.mediaQueue.length} items`}
          action={
            <button
              style={{
                backgroundColor: 'var(--color-highlight)',
                padding: '0 5px',
                marginLeft: 'auto',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onClick={this.openBrowser}
            >
              <Icon name="plus" /> Add
            </button>
          }
        >
          {media && media.hasMore && <MediaItem key="current" media={media} />}
          {this.props.mediaQueue.map((media, idx) => {
            return <MediaItem key={idx} media={media} />;
          })}
        </ListOverlay>

        <Chat
          className={styles.chat}
          messages={this.props.messages}
          sendMessage={this.sendChat}
          disabled={this.state.showBrowser}
        />

        <ActivityMonitor onChange={active => this.setState({ inactive: !active })} />
        {this.isInactive && <div className={styles.inactiveOverlay} />}
        {this.state.showBrowser && (
          <WebBrowser className={styles.browser} onClose={this.closeBrowser} />
        )}
      </div>
    );
  }

  private renderPlaybackControls(): JSX.Element {
    return (
      <PlaybackControls
        className={styles.playbackControls}
        reload={() => {
          console.log('reload', this, this.player);
          if (this.player) {
            this.player.reload();
          }
        }}
        debug={() => {
          if (this.player) {
            this.player.debug();
          }
        }}
        openBrowser={this.openBrowser}
      />
    );
  }

  private onWindowCommand = (sender: Electron.WebContents, cmd: string) => {
    switch (cmd) {
      case 'window:new-tab':
        this.openBrowser();
        break;
    }
  };

  private sendChat = (text: string): void => {
    if (isUrl(text)) {
      this.props.dispatch!(server_requestMedia(text));
    } else {
      this.props.dispatch!(server_addChat(text));
    }
  };

  private openBrowser = () => {
    this.setState({ showBrowser: true });
  };

  private closeBrowser = () => {
    this.setState({ showBrowser: false });
  };
}

export const GameLobby = connect((state: IAppState): IConnectedProps => {
  return {
    currentMedia: getCurrentMedia(state),
    mediaQueue: getMediaQueue(state),
    messages: state.chat.messages,
    playback: getPlaybackState(state),
    users: state.users,
    sessionName: getSessionName(state),
    updateAvailable: isUpdateAvailable(state)
  };
})(_GameLobby) as React.ComponentClass<IProps>;
