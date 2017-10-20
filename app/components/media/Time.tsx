import React, { PureComponent } from 'react';
import styles from './ProgressBar.css';
import { formatMs, formatShortMs } from 'utils/time';
import { Ticker } from 'components/Ticker';

const PLACEHOLDER = '00:00:00';

interface IProps {
  className?: string;
  time: number;
  realTime?: boolean;

  /** Show leading zeros (e.g. 00:04:12) */
  leading?: boolean;
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
    const timeStr = this.props.leading ? formatShortMs(time) : formatMs(time);

    let lead;

    if (this.props.leading) {
      const numLeadingChars = Math.max(0, PLACEHOLDER.length - timeStr.length);
      lead = PLACEHOLDER.substr(0, numLeadingChars);
    }

    return (
      <span className={this.props.className}>
        {lead && <span className="lead">{lead}</span>}
        {timeStr}
        {this.props.realTime && <Ticker fps={1} onTick={this.tick} />}
      </span>
    );
  }
}
