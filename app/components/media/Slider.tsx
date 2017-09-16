import React, { Component } from 'react';
import cx from 'classnames';
import styles from './Slider.css';
import { clamp } from 'utils/math';

interface IProps {
  className?: string;
  value: number;
  max?: number;
  onChange?: (value: number) => void;
}

interface IState {
  progress: number;
}

export class Slider extends Component<IProps> {
  static defaultProps: Partial<IProps> = {
    max: 1
  };

  render(): JSX.Element | null {
    const progress = clamp(this.props.value, 0, 1);

    const progressStyle = {
      width: `${progress * 100}%`
    };

    return (
      <div className={cx(this.props.className, styles.progress)} onClick={this.onClick}>
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
