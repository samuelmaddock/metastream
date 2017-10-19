import React, { Component } from 'react';
import cx from 'classnames';
import styles from './Slider.css';
import { clamp } from 'utils/math';
import { CuePointItem, CuePoint } from 'components/media/CuePoint';

/** px */
const CUE_GRAVITATE_THRESHOLD = 8;

interface IProps {
  className?: string;

  value: number;
  max?: number;

  cuePoints?: Readonly<CuePointItem>[];

  /** Allow scrolling */
  scroll?: boolean;

  /** Emit change event upon first drag event. */
  changeOnStart?: boolean;

  onChange?: (value: number) => void;

  onDragStart?: () => void;
  onDrag?: (value: number) => void;
  onDragEnd?: () => void;
}

interface IState {
  dragging?: boolean;
  dragProgress?: number;
  cuePoints?: Readonly<CuePointItem>[];
}

export class Slider extends Component<IProps> {
  static defaultProps: Partial<IProps> = {
    max: 1
  };

  state: IState = {};

  private rootEl: HTMLElement | null;

  componentDidMount(): void {
    if (this.rootEl && this.props.scroll) {
      this.rootEl.addEventListener('wheel', this.onMouseWheel, false);
    }
  }

  componentWillUnmount(): void {
    if (this.rootEl && this.props.scroll) {
      this.rootEl.removeEventListener('wheel', this.onMouseWheel, false);
    }

    if (this.state.dragging) {
      this.onDragEnd();
    }
  }

  /** Filter and sort cue points for efficient searching */
  private processCuePoints(cuePoints: CuePointItem[]) {
    const results = cuePoints.filter(({ value }) => !isNaN(value) && value > 0 && value <= 1);

    if (results.length === 0) {
      return;
    }

    results.sort((a, b) => {
      if (a.value > b.value) {
        return 1;
      } else if (a.value < b.value) {
        return -1;
      } else {
        return 0;
      }
    });

    return results;
  }

  componentWillReceiveProps(nextProps: IProps): void {
    const { cuePoints } = nextProps;
    if (cuePoints !== this.props.cuePoints) {
      this.setState({
        cuePoints: cuePoints && this.processCuePoints(cuePoints)
      });
    }
  }

  private renderCuePoints(): JSX.Element[] | undefined {
    const { cuePoints } = this.state;
    if (!cuePoints) {
      return;
    }

    const children = cuePoints.map((cue, idx) => {
      const p = clamp(cue.value, 0, 1);
      const style = {
        left: `${p * 100}%`
      };
      return <CuePoint key={idx} value={cue} style={style} />;
    });

    return children;
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
          {this.renderCuePoints()}
        </div>
      </div>
    );
  }

  private findClosestCuePoint(value: number) {
    const cuePoints = this.state.cuePoints!;
    const len = cuePoints.length;

    // TODO: assert(len !== 0)
    // TODO: assert(isSorted(cuePoints))

    let a = cuePoints;
    let lo = 0;
    let hi = len - 1;

    while (lo <= hi) {
      let mid = Math.floor((hi + lo) / 2);

      if (value < a[mid].value) {
        hi = mid - 1;
      } else if (value > a[mid].value) {
        lo = mid + 1;
      } else {
        return a[mid];
      }
    }

    // lo == hi + 1
    let lov = lo >= 0 && lo < len ? a[lo].value : Infinity;
    let hiv = hi >= 0 && hi < len ? a[hi].value : Infinity;
    const cp = lov - value < value - hiv ? a[lo] : a[hi];
    return cp || a[lo] || a[hi];
  }

  /** Nudge progress to cue points */
  private gravitate(progress: number, x: number, width: number): number {
    const { cuePoints } = this.state;
    if (!cuePoints || cuePoints.length === 0) {
      return progress;
    }

    const cue = this.findClosestCuePoint(progress);
    const cx = cue.value * width;
    const dx = Math.abs(x - cx);

    return dx <= CUE_GRAVITATE_THRESHOLD ? cue.value : progress;
  }

  private getMouseProgress(event: { pageX: number; altKey: boolean }): number {
    const { rootEl } = this;
    if (!rootEl) {
      return 0;
    }

    const bbox = rootEl.getBoundingClientRect();
    const width = bbox.width;
    const x = event.pageX - bbox.left;
    let progress = clamp(x / (width || 1), 0, 1);

    if (!event.altKey) {
      progress = this.gravitate(progress, x, width);
    }

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

    const progress = this.getMouseProgress(event);
    this.setState({ dragging: true, dragProgress: progress });

    document.addEventListener('mouseup', this.onDragEnd, false);
    document.addEventListener('mousemove', this.onDragging, false);

    if (this.props.onDragStart) {
      this.props.onDragStart();
    }

    if (this.props.changeOnStart && this.props.onChange) {
      this.props.onChange(progress);
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

  private onMouseWheel = (event: MouseWheelEvent) => {
    event.preventDefault();

    if (this.props.onChange) {
      const dt = event.deltaY || event.deltaX;
      const dir = dt === 0 ? 0 : dt > 0 ? -1 : 1;

      // Allow smoother scrolling on finer touchpads
      const multiplier = Math.abs(dt) / 100;

      const delta = 0.05 * multiplier;
      const value = this.props.value + delta * dir;
      this.props.onChange(value);
    }
  };
}
