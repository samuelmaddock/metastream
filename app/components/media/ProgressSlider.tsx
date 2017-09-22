import React, { Component } from 'react';
import { clamp } from 'utils/math';
import { Slider } from 'components/media/Slider';
import { Ticker } from 'components/Ticker';
import styles from './Slider.css';

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
  };

  render(): JSX.Element | null {
    return (
      <div className={styles.progressSlider}>
        <Slider value={this.state.progress} onChange={this.props.onChange} />
        <Ticker onTick={this.tick} />
      </div>
    );
  }
}
