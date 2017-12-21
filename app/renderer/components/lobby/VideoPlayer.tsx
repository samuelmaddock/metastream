import React, { Component } from 'react';
import cx from 'classnames';
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
import { PlaybackControls } from 'renderer/components/media/PlaybackControls';
import { setVolume } from 'lobby/actions/settings';
import { clamp } from 'utils/math';
import { WEBVIEW_PARTITION } from 'constants/http';

interface IProps {
  className?: string;
  theRef?: (c: _VideoPlayer | null) => void;
}

interface IConnectedProps extends IMediaPlayerState {
  mute: boolean;
  volume: number;
}

interface IState {
  /** Webview is initializing, try to mitigate white flash */
  initializing: boolean;

  interacting: boolean;
}

const mapStateToProps = (state: ILobbyNetState): IConnectedProps => {
  return {
    ...state.mediaPlayer,
    mute: state.settings.mute,
    volume: state.settings.volume
  };
};

type PrivateProps = IProps & IConnectedProps & DispatchProp<ILobbyNetState>;

class _VideoPlayer extends Component<PrivateProps, IState> {
  private webview: Electron.WebviewTag | null;
  private initTimeoutId?: number;

  state: IState = { initializing: true, interacting: false };

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

  componentDidMount(): void {
    if (this.props.theRef) {
      this.props.theRef(this);
    }

    this.initTimeoutId = setTimeout(() => {
      this.initTimeoutId = undefined;
      this.setState({ initializing: false });
    }, 500) as any;
  }

  componentWillUnmount(): void {
    if (this.props.theRef) {
      this.props.theRef(null);
    }

    if (this.initTimeoutId) {
      clearTimeout(this.initTimeoutId);
    }
  }

  componentDidUpdate(prevProps: PrivateProps): void {
    const { current } = this.props;
    const { current: prevMedia } = prevProps;

    // Force restart media if new media is the same URL
    if (current && prevMedia && current !== prevMedia && current.url === prevMedia.url) {
      this.onMediaReady();
      return;
    }

    if (this.props.playback !== prevProps.playback) {
      this.updatePlayback(this.props.playback);
    }

    if (
      (this.isPlaying && this.props.startTime !== prevProps.startTime) ||
      (this.isPaused && this.props.pauseTime !== prevProps.pauseTime)
    ) {
      this.updatePlaybackTime();
    }

    if (this.props.volume !== prevProps.volume || this.props.mute !== prevProps.mute) {
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
        this.onMediaReady();
        break;
    }
  };

  private onMediaReady = () => {
    this.updatePlaybackTime();
    this.updatePlayback(this.props.playback);
    this.updateVolume();
  };

  private updatePlaybackTime = () => {
    const { current: media } = this.props;

    if (media && media.duration === 0) {
      console.debug('Preventing updating playback since duration indicates livestream');
      return; // live stream
    }

    let time;

    if (this.isPlaying) {
      time = Date.now() - this.props.startTime!;
    } else if (this.isPaused) {
      time = this.props.pauseTime!;
    }

    if (typeof time === 'number') {
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
    if (!this.webview) {
      return;
    }

    const { volume, mute } = this.props;

    if (mute !== this.webview.isAudioMuted()) {
      this.webview.setAudioMuted(mute);
    }

    const newVolume = this.props.mute ? 0 : this.props.volume;
    this.webview.send('media-volume', this.scaleVolume(newVolume));
  };

  /**
   * Use dB scale to convert linear volume to exponential.
   * https://www.dr-lex.be/info-stuff/volumecontrols.html
   */
  private scaleVolume(volume: number): number {
    return clamp(Math.exp(6.908 * volume) / 1000, 0, 1);
  }

  render(): JSX.Element | null {
    return (
      <div
        className={cx(styles.container, this.props.className)}
        onDoubleClick={this.onDoubleClick}
      >
        {this.renderBrowser()}
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
        class={cx(styles.video, {
          [styles.loading]: this.state.initializing,
          [styles.interactive]: this.state.interacting
        })}
        /* Some website embeds are disabled without an HTTP referrer */
        httpreferrer="http://mediaplayer.samuelmaddock.com/"
        /* Disable plugins until we know we need them */
        plugins="true"
        preload="./preload.js"
        partition={WEBVIEW_PARTITION}
        ondblclick={this.onDoubleClick}
      />
    );
  }

  reload(): void {
    // Sometimes loadURL won't work if media is still playing
    // This happens with mixcloud.com
    // this.updatePlayback(PlaybackState.Paused);

    if (this.webview) {
      this.webview.loadURL(this.mediaUrl);
    }
  }

  debug(): void {
    if (this.webview && !this.webview.isDevToolsOpened()) {
      this.webview.openDevTools();
    }
  }

  private onExitInteractMode() {
    document.removeEventListener('keydown', this.onKeyDown, false);
    this.setState({ interacting: false });
  }

  private onDoubleClick = () => {
    this.setState({ interacting: true }, () => {
      document.addEventListener('keydown', this.onKeyDown, false);
    });
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'Escape':
        this.onExitInteractMode();
        return;
    }
  };
}

export type VideoPlayer = _VideoPlayer;
export const VideoPlayer = netConnect<{}, {}, IProps>(mapStateToProps)(_VideoPlayer);
