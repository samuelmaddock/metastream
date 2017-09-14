import React, { Component } from 'react';
import styles from './VideoPlayer.css';
import { MediaControls } from 'components/lobby/MediaControls';
import { IMediaItem, PlaybackState, IMediaPlayerState } from 'lobby/reducers/mediaPlayer';
import { Dispatch } from 'redux';
import { server_requestPlayPause } from 'lobby/actions/mediaPlayer';
import { netConnect, ILobbyNetState } from 'lobby';
import { DispatchProp } from 'react-redux';

interface IProps {}

interface IConnectedProps extends IMediaPlayerState {}

const mapStateToProps = (state: ILobbyNetState): IConnectedProps => {
  return state.mediaPlayer;
};

type PrivateProps = IProps & IConnectedProps & DispatchProp<ILobbyNetState>;

class _VideoPlayer extends Component<PrivateProps> {
  private webview: Electron.WebviewTag | null;

  componentDidUpdate(prevProps: PrivateProps): void {
    if (this.props.playback !== prevProps.playback) {
      this.updatePlayback(this.props.playback);
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
    const { startTime } = this.props;
    if (startTime) {
      const time = Date.now() - startTime;
      console.log('Sending seek IPC message', time);
      this.webview!.send('media-seek', time);
    }
  };

  private updatePlayback = (state: PlaybackState) => {
    if (this.webview) {
      // TODO: send IPC
    }
  };

  render(): JSX.Element | null {
    // TODO: Remove `is` attribute from webview when React 16 is out
    // https://stackoverflow.com/a/33860892/1490006
    return (
      <div className={styles.container}>
        {this.renderBrowser()}
        {this.renderControls()}
      </div>
    );
  }

  private renderBrowser(): JSX.Element {
    const { current: media } = this.props;
    const src = media ? media.url : 'https://www.google.com/';

    return (
      <webview
        is="is"
        ref={this.setupWebview}
        src={src}
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
      <MediaControls
        media={this.props.current}
        startTime={this.props.startTime}
        playback={this.props.playback}
        playPause={() => {
          this.props.dispatch!(server_requestPlayPause());
        }}
        reload={() => {
          if (this.webview) {
            this.webview.reload();
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
