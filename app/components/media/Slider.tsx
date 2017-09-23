import React, { Component } from 'react';
import cx from 'classnames';
import styles from './Slider.css';
import { clamp } from 'utils/math';

interface IProps {
  className?: string;

  value: number;
  max?: number;

  onChange?: (value: number) => void;

  onDragStart?: () => void;
  onDrag?: (value: number) => void;
  onDragEnd?: () => void;
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

  componentWillUnmount(): void {
    if (this.state.dragging) {
      this.onDragEnd();
    }
  }

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
        onClick={this.onClick}
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

  private getMouseProgress(event: { pageX: number }): number {
    const { rootEl } = this;
    if (!rootEl) {
      return 0;
    }

    const bbox = rootEl.getBoundingClientRect();
    const width = bbox.width;
    const x = event.pageX - bbox.left;
    const progress = clamp(x / (width || 1), 0, 1);
    return progress;
  }

  private onClick = (event: React.MouseEvent<HTMLElement>) => {
    if (this.state.dragging) {
      return;
    }

    event.preventDefault();

    const progress = this.getMouseProgress(event);

    if (this.props.onChange) {
      this.props.onChange(progress);
    }
  };

  private onDragStart = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    this.setState({ dragging: true });

    document.addEventListener('mouseup', this.onDragEnd, false);
    document.addEventListener('mousemove', this.onDragging, false);

    if (this.props.onDragStart) {
      this.props.onDragStart();
    }
  };

  private onDragging = (event: MouseEvent) => {
    const progress = this.getMouseProgress(event);
    this.setState({ dragProgress: progress });

    if (this.props.onDrag) {
      this.props.onDrag(progress);
    }
  };

  private onDragEnd = () => {
    document.removeEventListener('mouseup', this.onDragEnd, false);
    document.removeEventListener('mousemove', this.onDragging, false);

    if (this.props.onChange && typeof this.state.dragProgress === 'number') {
      this.props.onChange(this.state.dragProgress);
    }

    this.setState({ dragging: false, dragProgress: undefined });

    if (this.props.onDragEnd) {
      this.props.onDragEnd();
    }
  };
}
