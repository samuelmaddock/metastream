import React, { Component } from 'react';
import cx from 'classnames';
import styles from './PlaybackControls.css';
import { PlaybackState, IMediaItem, IMediaPlayerState } from 'lobby/reducers/mediaPlayer';
import { Time } from 'components/media/Time';
import { ProgressSlider } from 'components/media/ProgressSlider';
import { VolumeSlider } from 'components/media/VolumeSlider';
import { netConnect, ILobbyNetState } from 'lobby';
import { DispatchProp } from 'react-redux';
import {
  server_requestPlayPause,
  server_requestNextMedia,
  server_requestSeek
} from 'lobby/actions/mediaPlayer';
import { setVolume } from 'lobby/actions/settings';
import { Icon } from 'components/Icon';

interface IProps {
  className?: string;
  reload?: React.MouseEventHandler<HTMLButtonElement>;
  debug?: React.MouseEventHandler<HTMLButtonElement>;
}

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

class _PlaybackControls extends Component<PrivateProps> {
  render(): JSX.Element | null {
    const { current: media, playback, startTime } = this.props;
    const playbackIcon = playback === PlaybackState.Playing ? 'pause' : 'play';

    const disabled = playback === PlaybackState.Idle;
    const duration = (media && media.duration) || 0;

    return (
      <div className={cx(this.props.className, styles.container)}>
        <button type="button" className={styles.button} onClick={this.playPause}>
          <Icon name={playbackIcon} />
        </button>
        <button type="button" title="Next" className={styles.button} onClick={this.next}>
          <Icon name="skip-forward" />
        </button>
        {!disabled && <Time className={styles.time} time={startTime || 0} realTime />}
        <ProgressSlider
          startTime={startTime || 0}
          duration={duration}
          disabled={disabled}
          onChange={this.onSliderChange}
        />
        {!disabled && <Time className={styles.time} time={(media && media.duration) || 0} />}
        <VolumeSlider volume={this.props.volume} onChange={this.setVolume} />
        <button type="button" className={styles.button} title="Reload" onClick={this.props.reload}>
          <Icon name="rotate-cw" />
        </button>
        <button type="button" className={styles.button} title="Debug" onClick={this.props.debug}>
          <Icon name="settings" />
        </button>
      </div>
    );
  }

  private onSliderChange = (progress: number): void => {
    const { current: media } = this.props;
    const duration = (media && media.duration) || 0;
    const time = duration * progress;

    this.seek(time);
  };

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
}

export const PlaybackControls = netConnect<{}, {}, IProps>(mapStateToProps)(_PlaybackControls);
