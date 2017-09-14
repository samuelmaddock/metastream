import React, { Component } from 'react';
import styles from './ProgressBar.css';
import { formatSeconds } from 'utils/time';
import { Time } from 'components/media/Time';
import { clamp } from 'utils/math';

interface IProps {
  disabled?: boolean;
  startTime: number;
  duration: number;
}

export class ProgressBar extends Component<IProps> {
  render(): JSX.Element | null {
    const { startTime, duration, disabled } = this.props;

    const curTime = Date.now() - startTime;
    const progress = clamp(disabled ? 0 : curTime / (duration || 1), 0, 1);
    const progressStyle = {
      width: `${progress * 100}%`
    };

    return (
      <div className={styles.container}>
        {!disabled && <Time className={styles.time} time={startTime} realTime />}
        <div className={styles.progress}>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={progressStyle} />
          </div>
        </div>
        {!disabled && <Time className={styles.time} time={duration} />}
      </div>
    );
  }
}
