import React, { Component } from 'react';
import styles from './MediaControls.css';

interface IProps {
  onPlayPause?: React.MouseEventHandler<HTMLButtonElement>;
  onDebug?: React.MouseEventHandler<HTMLButtonElement>;
}

export class MediaControls extends Component<IProps> {
  render(): JSX.Element | null {
    return (
      <div className={styles.container}>
        <button type="button" className={styles.button} onClick={this.props.onPlayPause}>
          ❚❚
        </button>
        <input type="range" className={styles.seekbar} defaultValue="0" />
        <button type="button" className={styles.button} onClick={this.props.onDebug}>
          Debug
        </button>
      </div>
    );
  }
}
