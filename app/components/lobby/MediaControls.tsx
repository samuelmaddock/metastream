import React, { Component } from 'react';
import styles from './MediaControls.css';
import { PlaybackState, IMediaItem } from 'lobby/reducers/mediaPlayer';
import { ProgressBar } from 'components/media/ProgressBar';

interface IProps {
  media?: IMediaItem;
  startTime?: number;
  playback: PlaybackState;
  playPause?: React.MouseEventHandler<HTMLButtonElement>;
  reload?: React.MouseEventHandler<HTMLButtonElement>;
  debug?: React.MouseEventHandler<HTMLButtonElement>;
}

export class MediaControls extends Component<IProps> {
  render(): JSX.Element | null {
    const { playback, media } = this.props;
    const playbackIcon = playback === PlaybackState.Playing ? '⏸️' : '▶️';

    return (
      <div className={styles.container}>
        <button type="button" className={styles.button} onClick={this.props.playPause}>
          {playbackIcon}
        </button>
        <button type="button" title="Next" className={styles.button}>
          ⏭️
        </button>
        <ProgressBar
          startTime={(media && this.props.startTime) || 0}
          duration={(media && media.duration) || 0}
          disabled={playback === PlaybackState.Idle}
        />
        <button type="button" className={styles.button} title="Reload" onClick={this.props.reload}>
          🔄
        </button>
        <button type="button" className={styles.button} title="Debug" onClick={this.props.debug}>
          🛠️
        </button>
      </div>
    );
  }
}
