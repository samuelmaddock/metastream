import React, { Component } from 'react';
import cx from 'classnames';
import styles from './PlaybackControls.css';
import { PlaybackState, IMediaItem, IMediaPlayerState } from 'lobby/reducers/mediaPlayer';
import { Time } from 'components/media/Time';
import { VolumeSlider } from 'components/media/VolumeSlider';
import { netConnect, ILobbyNetState } from 'lobby';
import { DispatchProp } from 'react-redux';
import {
  server_requestPlayPause,
  server_requestNextMedia,
  server_requestSeek
} from 'lobby/actions/mediaPlayer';
import { setVolume, setMute } from 'lobby/actions/settings';
import { Icon } from 'components/Icon';
import { Timeline } from 'components/media/Timeline';
import { push } from 'react-router-redux';
import { openInBrowser } from 'utils/url';
import { copyToClipboard } from 'utils/clipboard';
import { timestampToMilliseconds, parseTimestampPairs } from 'utils/cuepoints';
import { CuePointItem } from 'components/media/CuePoint';
import { parseCuePoints } from 'media/utils';

interface IProps {
  className?: string;
  reload?: React.MouseEventHandler<HTMLButtonElement>;
  debug?: React.MouseEventHandler<HTMLButtonElement>;
}

interface IConnectedProps extends IMediaPlayerState {
  mute: boolean;
  volume: number;
}

const mapStateToProps = (state: ILobbyNetState): IConnectedProps => {
  return {
    ...state.mediaPlayer,
    mute: state.settings.mute,
    volume: state.settings.volume
  };
};

type PrivateProps = IProps & IConnectedProps & DispatchProp<ILobbyNetState>;

class _PlaybackControls extends Component<PrivateProps> {
  private get canDebug() {
    return process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
  }

  private getCuePoints() {
    const { current: media } = this.props;
    if (media) {
      let cuePoints = parseCuePoints(media);
      return cuePoints;
    }
  }

  render(): JSX.Element | null {
    const { current: media, playback, startTime, pauseTime } = this.props;
    const playbackIcon = playback === PlaybackState.Playing ? 'pause' : 'play';

    const isIdle = playback === PlaybackState.Idle;
    const isPaused = playback === PlaybackState.Paused;
    const duration = (media && media.duration) || 0;
    const isTimed = duration > 0;

    const playPauseBtn = (
      <button type="button" className={styles.button} disabled={isIdle} onClick={this.playPause}>
        <Icon name={playbackIcon} />
      </button>
    );

    const nextBtn = (
      <button
        type="button"
        title="Next"
        className={styles.button}
        disabled={isIdle}
        onClick={this.next}
      >
        <Icon name="skip-forward" />
      </button>
    );

    const timeline =
      isIdle || !isTimed ? (
        <span className={styles.spacer} />
      ) : (
        <Timeline
          className={styles.spacer}
          time={(isPaused ? pauseTime : startTime) || 0}
          paused={isPaused}
          duration={media && media.duration}
          onSeek={this.seek}
          cuePoints={this.getCuePoints()}
        />
      );

    const volumeSlider = (
      <VolumeSlider
        mute={this.props.mute}
        volume={this.props.volume}
        onChange={this.setVolume}
        onMute={this.toggleMute}
      />
    );

    const reloadBtn = (
      <button type="button" className={styles.button} title="Reload" onClick={this.props.reload}>
        <Icon name="rotate-cw" />
      </button>
    );

    const infoBtn =
      media && media.description ? (
        <button
          type="button"
          className={styles.button}
          title="Show description"
          onClick={this.openLink}
        >
          <Icon name="info" />
        </button>
      ) : (
        undefined
      );

    const externalLinkBtn = media && (
      <button
        type="button"
        className={styles.button}
        title="Open in browser"
        onClick={this.openLink}
      >
        <Icon name="external-link" />
      </button>
    );

    const copyLinkBtn = media && (
      <button type="button" className={styles.button} title="Copy link" onClick={this.copyLink}>
        <Icon name="copy" />
      </button>
    );

    const debugBtn = this.canDebug && (
      <button type="button" className={styles.button} title="Debug" onClick={this.props.debug}>
        <Icon name="settings" />
      </button>
    );

    const disconnectBtn = (
      <button type="button" className={styles.button} title="Disconnect" onClick={this.disconnect}>
        <Icon name="log-out" />
      </button>
    );

    return (
      <div className={cx(this.props.className, styles.container)}>
        {playPauseBtn}
        {nextBtn}
        {timeline}
        {volumeSlider}
        {infoBtn}
        {externalLinkBtn}
        {copyLinkBtn}
        {reloadBtn}
        {debugBtn}
        {disconnectBtn}
      </div>
    );
  }

  private playPause = () => {
    this.props.dispatch!(server_requestPlayPause());
  };

  private next = () => {
    this.props.dispatch!(server_requestNextMedia());
  };

  private seek = (time: number) => {
    this.props.dispatch!(server_requestSeek(time));
  };

  private setVolume = (volume: number) => {
    this.props.dispatch!(setVolume(volume));
  };

  private toggleMute = () => {
    const mute = !this.props.mute;
    this.props.dispatch!(setMute(mute));
  };

  private openLink = () => {
    const { current: media } = this.props;
    if (media) {
      openInBrowser(media.requestUrl);
    }
  };

  private copyLink = () => {
    const { current: media } = this.props;
    if (media) {
      copyToClipboard(media.requestUrl);
    }
  };

  private disconnect = () => {
    // TODO: Use react-router-redux actions after refactoring to not use
    // multiple redux stores
    window.location.hash = '#/';
  };
}

export const PlaybackControls = netConnect<{}, {}, IProps>(mapStateToProps)(_PlaybackControls);
