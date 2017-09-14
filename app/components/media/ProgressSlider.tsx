import React, { Component } from 'react';
import styles from './ProgressSlider.css';
import { clamp } from 'utils/math';

interface IProps {
  disabled?: boolean;
  startTime: number;
  duration: number;
  onChange?: (progress: number) => void;
}

interface IState {
  progress: number;
}

export class ProgressSlider extends Component<IProps> {
  state: IState = { progress: this.calcProgress() };

  private frameId?: number;

  private calcProgress() {
    const time = Date.now() - this.props.startTime;
    return clamp(time / (this.props.duration || 1), 0, 1);
  }

  private tick = () => {
    this.setState({ progress: this.calcProgress() });
    this.frameId = requestAnimationFrame(this.tick);
  };

  private startTimer() {
    this.frameId = requestAnimationFrame(this.tick);
  }

  private stopTimer() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = undefined;
    }
  }

  componentDidMount(): void {
    this.startTimer();
  }

  componentWillUnmount(): void {
    this.stopTimer();
  }

  render(): JSX.Element | null {
    const { startTime, duration, disabled } = this.props;

    const progressStyle = {
      width: `${this.state.progress * 100}%`
    };

    return (
      <div className={styles.progress} onClick={this.onClick}>
        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={progressStyle} />
        </div>
      </div>
    );
  }

  private onClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const bbox = target.getBoundingClientRect();
    const width = bbox.width;
    const x = event.pageX - target.offsetLeft;
    const progress = x / (width || 1);

    if (this.props.onChange) {
      this.props.onChange(progress);
    }
  };
}
