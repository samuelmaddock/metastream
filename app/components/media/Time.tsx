import React, { Component } from 'react';
import styles from './ProgressBar.css';
import { formatSeconds } from 'utils/time';

interface IProps {
  className?: string;
  time: number;
  realTime?: boolean;
}

interface IState {
  time: number;
}

export class Time extends Component<IProps, IState> {
  state: IState = { time: 0 };

  private timerId?: number;

  private calcTime() {
    const time = Math.floor((Date.now() - this.props.time) / 1000);
    return time;
  }

  private tick = () => {
    this.setState({ time: this.calcTime() });
  };

  private startTimer() {
    // TODO: Use rAF in combination with setInterval
    this.timerId = setInterval(this.tick, 1000) as any;
    this.tick();
  }

  private stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  componentDidMount(): void {
    if (this.props.realTime) {
      this.startTimer();
    }
  }

  componentWillUnmount(): void {
    this.stopTimer();
  }

  render(): JSX.Element {
    const time = this.props.realTime ? this.state.time : this.props.time;
    return <span className={this.props.className}>{formatSeconds(time)}</span>;
  }
}
