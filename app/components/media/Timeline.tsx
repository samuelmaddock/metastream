import React, { PureComponent } from 'react';
import cx from 'classnames';
import styles from './Timeline.css';
import { formatMs } from 'utils/time';
import { Ticker } from 'components/Ticker';
import { Time } from 'components/media/Time';
import { ProgressSlider } from 'components/media/ProgressSlider';

interface IProps {
  className?: string;

  /** Unix start time. When paused this is the current time. */
  time: number;

  paused?: boolean;
  duration?: number;
  onSeek?: (time: number) => void;
}

interface IState {
  time: number;
}

export class Timeline extends PureComponent<IProps, IState> {
  static defaultProps: Partial<IProps> = {
    duration: 0
  };

  state: IState = { time: 0 };

  private tick = () => {
    const time = Date.now() - this.props.time;
    this.setState({ time });
  };

  render(): JSX.Element {
    const { time, paused, duration, onSeek } = this.props;
    return (
      <span className={cx(this.props.className, styles.container)}>
        <Time className={styles.time} time={time} realTime={!paused} />
        <ProgressSlider
          startTime={time}
          duration={duration!}
          disabled={paused}
          onChange={(progress: number) => {
            if (onSeek) {
              onSeek(progress * (duration || 0));
            }
          }}
        />
        <Time className={styles.time} time={duration!} />
      </span>
    );
  }
}
