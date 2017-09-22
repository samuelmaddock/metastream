import React, { PureComponent } from 'react';
import styles from './ProgressBar.css';
import { formatMs } from 'utils/time';
import { Ticker } from 'components/Ticker';

interface IProps {
  className?: string;
  time: number;
  realTime?: boolean;
}

interface IState {
  time: number;
}

export class Time extends PureComponent<IProps, IState> {
  state: IState = { time: 0 };

  private tick = () => {
    const time = Date.now() - this.props.time;
    this.setState({ time });
  };

  render(): JSX.Element {
    const time = this.props.realTime ? this.state.time : this.props.time;
    return (
      <span className={this.props.className}>
        {formatMs(time)}
        {this.props.realTime && <Ticker fps={1} onTick={this.tick} />}
      </span>
    );
  }
}
