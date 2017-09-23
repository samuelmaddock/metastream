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
  dragging?: boolean;
  dragProgress?: number;
}

export class Slider extends Component<IProps> {
  static defaultProps: Partial<IProps> = {
    max: 1
  };

  state: IState = {};

  private rootEl: HTMLElement | null;

  render(): JSX.Element | null {
    const { dragProgress } = this.state;
    const progress =
      typeof dragProgress === 'number' ? dragProgress : clamp(this.props.value, 0, 1);

    const progressStyle = {
      width: `${progress * 100}%`
    };

    const knobStyle = {
      left: `${progress * 100}%`
    };

    return (
      <div
        ref={el => {
          this.rootEl = el;
        }}
        className={cx(this.props.className, styles.progress)}
        onMouseDown={this.onDragStart}
      >
        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={progressStyle} />
          <button
            type="button"
            className={cx(styles.knob, { active: this.state.dragging })}
            style={knobStyle}
          />
        </div>
      </div>
    );
  }

  private onDragStart = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    this.setState({ dragging: true });

    document.addEventListener('mouseup', this.onDragEnd, false);
    document.addEventListener('mousemove', this.onDragging, false);
  };

  private onDragging = (event: MouseEvent) => {
    const { rootEl } = this;
    if (!rootEl) {
      return;
    }

    const bbox = rootEl.getBoundingClientRect();
    const width = bbox.width;
    const x = event.pageX - bbox.left;
    const progress = clamp(x / (width || 1), 0, 1);

    this.setState({ dragProgress: progress });
  };

  private onDragEnd = (event: MouseEvent) => {
    event.preventDefault();

    document.removeEventListener('mouseup', this.onDragEnd, false);
    document.removeEventListener('mousemove', this.onDragging, false);

    if (this.props.onChange && typeof this.state.dragProgress === 'number') {
      this.props.onChange(this.state.dragProgress);
    }

    this.setState({ dragging: false, dragProgress: undefined });
  };
}
