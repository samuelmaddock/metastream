import React, { Component } from 'react';
import styles from './MediaControls.css';
import { PlaybackState } from 'lobby/reducers/mediaPlayer';
import { ProgressBar } from 'components/media/ProgressBar';

interface IProps {
  playback: PlaybackState;
  playPause?: React.MouseEventHandler<HTMLButtonElement>;
  reload?: React.MouseEventHandler<HTMLButtonElement>;
  debug?: React.MouseEventHandler<HTMLButtonElement>;
}

export class MediaControls extends Component<IProps> {
  render(): JSX.Element | null {
    const playbackIcon = this.props.playback === PlaybackState.Playing ? '⏸️' : '▶️';

    return (
      <div className={styles.container}>
        <button type="button" className={styles.button} onClick={this.props.playPause}>
          {playbackIcon}
        </button>
        <button type="button" title="Next" className={styles.button}>
          ⏭️
        </button>
        <ProgressBar startTime={Date.now()} duration={3600} />
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
