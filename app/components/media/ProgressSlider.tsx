import React, { Component } from 'react';
import { clamp } from 'utils/math';
import { Slider } from 'components/media/Slider';

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
    return <Slider value={this.state.progress} onChange={this.props.onChange} />;
  }
}
