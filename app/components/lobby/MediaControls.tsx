import React, { Component } from 'react';
import styles from './MediaControls.css';

interface IProps {
  playPause?: React.MouseEventHandler<HTMLButtonElement>;
  reload?: React.MouseEventHandler<HTMLButtonElement>;
  debug?: React.MouseEventHandler<HTMLButtonElement>;
}

export class MediaControls extends Component<IProps> {
  render(): JSX.Element | null {
    return (
      <div className={styles.container}>
        <button type="button" className={styles.button} onClick={this.props.playPause}>
          ❚❚
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
