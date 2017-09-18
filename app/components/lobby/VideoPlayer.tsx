import React, { Component } from 'react';
import styles from './VideoPlayer.css';
import { IMediaItem, PlaybackState, IMediaPlayerState } from 'lobby/reducers/mediaPlayer';
import { Dispatch } from 'redux';
import {
  server_requestPlayPause,
  server_requestNextMedia,
  server_requestSeek
} from 'lobby/actions/mediaPlayer';
import { netConnect, ILobbyNetState } from 'lobby';
import { DispatchProp } from 'react-redux';
import { PlaybackControls } from 'components/media/PlaybackControls';
import { setVolume } from 'lobby/actions/settings';

interface IProps {}

interface IConnectedProps extends IMediaPlayerState {
  volume: number;
}

const mapStateToProps = (state: ILobbyNetState): IConnectedProps => {
  return {
    ...state.mediaPlayer,
    volume: state.settings.volume
  };
};

type PrivateProps = IProps & IConnectedProps & DispatchProp<ILobbyNetState>;

class _VideoPlayer extends Component<PrivateProps> {
  private webview: Electron.WebviewTag | null;

  get isPlaying() {
    return this.props.playback === PlaybackState.Playing;
  }

  get isPaused() {
    return this.props.playback === PlaybackState.Paused;
  }

  get mediaUrl() {
    const media = this.props.current;
    return media ? media.url : './idlescreen.html';
  }

  componentDidUpdate(prevProps: PrivateProps): void {
    if (this.props.playback !== prevProps.playback) {
      this.updatePlayback(this.props.playback);
    }

    if (
      (this.isPlaying && this.props.startTime !== prevProps.startTime) ||
      (this.isPaused && this.props.pauseTime !== prevProps.pauseTime)
    ) {
      this.updatePlaybackTime();
    }

    if (this.props.volume !== prevProps.volume) {
      this.updateVolume();
    }
  }

  private setupWebview = (webview: Electron.WebviewTag | null): void => {
    this.webview = webview;
    if (!this.webview) {
      return;
    }

    this.webview.addEventListener('ipc-message', this.onIpcMessage);
  };

  private onIpcMessage = (event: Electron.IpcMessageEvent) => {
    console.log('Received VideoPlayer IPC message', event);

    switch (event.channel) {
      case 'media-ready':
        this.onMediaReady(event);
        break;
    }
  };

  private onMediaReady = (event: Electron.IpcMessageEvent) => {
    this.updatePlaybackTime();
    this.updatePlayback(this.props.playback);
    this.updateVolume();
  };

  private updatePlaybackTime = () => {
    let time;

    if (this.isPlaying) {
      time = Date.now() - this.props.startTime!;
    } else if (this.isPaused) {
      time = this.props.pauseTime!;
    }

    if (time) {
      console.log('Sending seek IPC message', time);
      this.webview!.send('media-seek', time);
    }
  };

  private updatePlayback = (state: PlaybackState) => {
    if (this.webview) {
      this.webview.send('media-playback', state);
    }
  };

  private updateVolume = () => {
    if (this.webview) {
      this.webview.send('media-volume', this.props.volume);
    }
  };

  render(): JSX.Element | null {
    return (
      <div className={styles.container}>
        {this.renderBrowser()}
        {this.renderControls()}
      </div>
    );
  }

  private renderBrowser(): JSX.Element {
    // TODO: Remove `is` attribute from webview when React 16 is out
    // https://stackoverflow.com/a/33860892/1490006
    return (
      <webview
        is="is"
        ref={this.setupWebview}
        src={this.mediaUrl}
        class={styles.video}
        /* Some website embeds are disabled without an HTTP referrer */
        httpreferrer="http://mediaplayer.samuelmaddock.com/"
        /* Disable plugins until we know we need them */
        plugins="false"
        preload="./preload.js"
        partition="custom"
      />
    );
  }

  private renderControls(): JSX.Element | null {
    // if (this.props.playback === PlaybackState.Idle) {
    //   return null;
    // }

    return (
      <PlaybackControls
        media={this.props.current}
        startTime={this.props.startTime}
        playback={this.props.playback}
        volume={this.props.volume}
        playPause={() => {
          this.props.dispatch!(server_requestPlayPause());
        }}
        next={() => {
          this.props.dispatch!(server_requestNextMedia());
        }}
        seek={time => {
          this.props.dispatch!(server_requestSeek(time));
        }}
        setVolume={volume => {
          this.props.dispatch!(setVolume(volume));
        }}
        reload={() => {
          if (this.webview) {
            this.webview.loadURL(this.mediaUrl);
          }
        }}
        debug={() => {
          if (this.webview) {
            this.webview.openDevTools();
          }
        }}
      />
    );
  }
}

export const VideoPlayer = netConnect<{}, {}, IProps>(mapStateToProps)(_VideoPlayer);
