import React, { Component } from 'react';
import styles from './MediaControls.css';
import { PlaybackState } from 'lobby/reducers/mediaPlayer';

interface IProps {
  playback: PlaybackState;
  playPause?: React.MouseEventHandler<HTMLButtonElement>;
  reload?: React.MouseEventHandler<HTMLButtonElement>;
  debug?: React.MouseEventHandler<HTMLButtonElement>;
}

export class MediaControls extends Component<IProps> {
  render(): JSX.Element | null {
    const playbackIcon = this.props.playback === PlaybackState.Playing ? '❚❚' : '▶';

    return (
      <div className={styles.container}>
        <button type="button" className={styles.button} onClick={this.props.playPause}>
          {playbackIcon}
        </button>
        <input type="range" className={styles.seekbar} defaultValue="0" />
        <button type="button" className={styles.button} onClick={this.props.reload}>
          Reload
        </button>
        <button type="button" className={styles.button} onClick={this.props.debug}>
          Debug
        </button>
      </div>
    );
  }
}
