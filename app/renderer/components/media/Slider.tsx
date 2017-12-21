import React, { Component } from 'react';
import cx from 'classnames';
import styles from './Slider.css';
import { clamp } from 'utils/math';
import { CuePointItem, CuePoint } from 'renderer/components/media/CuePoint';

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
  activeCuePointIndex?: number;
}

export class Slider extends Component<IProps> {
  static defaultProps: Partial<IProps> = {
    max: 1,
    changeOnStart: false
  };

  state: IState = {};

  private rootEl: HTMLElement | null;
  private preventClick?: boolean;

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
    const results = cuePoints.filter(({ value }) => !isNaN(value) && value >= 0 && value <= 1);

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
    const { cuePoints, activeCuePointIndex } = this.state;
    if (!cuePoints) {
      return;
    }

    const children = cuePoints.map((cue, idx) => {
      const p = clamp(cue.value, 0, 1);
      const style = {
        left: `${p * 100}%`
      };
      return <CuePoint key={idx} value={cue} active={idx === activeCuePointIndex} style={style} />;
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

  private findClosestCuePointIndex(value: number) {
    const cuePoints = this.state.cuePoints;

    if (!cuePoints || cuePoints.length === 0) {
      return;
    }

    // TODO: assert(len !== 0)
    // TODO: assert(isSorted(cuePoints))

    const len = cuePoints.length;
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
        return mid;
      }
    }

    // lo == hi + 1
    let lov = lo >= 0 && lo < len ? a[lo].value : Infinity;
    let hiv = hi >= 0 && hi < len ? a[hi].value : Infinity;
    const cp = lov - value < value - hiv ? lo : hi;
    return a[cp] ? cp : (a[lo] && lo) || (a[hi] && hi);
  }

  /** Nudge progress to cue points */
  private maybeGravitate(
    cue: Readonly<CuePointItem>,
    x: number,
    width: number
  ): number | undefined {
    const cx = cue.value * width;
    const dx = Math.abs(x - cx);

    return dx <= CUE_GRAVITATE_THRESHOLD ? cue.value : undefined;
  }

  /**
   * Calculate progress and update related state.
   *
   * Shows cue point tooltips.
   */
  private updateProgress(
    event: { pageX: number; altKey: boolean },
    fireChange: boolean = true
  ): number {
    const { rootEl } = this;
    if (!rootEl) {
      return 0;
    }

    const bbox = rootEl.getBoundingClientRect();
    const width = bbox.width;
    const x = event.pageX - bbox.left;
    let progress = clamp(x / (width || 1), 0, 1);

    {
      const cueIdx = this.findClosestCuePointIndex(progress);

      if (cueIdx) {
        const { activeCuePointIndex } = this.state;

        // Attempt to gravitate progress towards closest cue point
        const cue = this.state.cuePoints![cueIdx];
        const gravityProgress = this.maybeGravitate(cue, x, width);
        const didGravitate = !!gravityProgress;

        if (didGravitate) {
          if (activeCuePointIndex !== cueIdx) {
            this.setState({ activeCuePointIndex: cueIdx });
          }

          if (!event.altKey) {
            progress = gravityProgress!;
          }
        } else if (activeCuePointIndex) {
          this.setState({ activeCuePointIndex: undefined });
        }
      }
    }

    if (fireChange && this.props.onChange) {
      this.props.onChange(progress);
    }

    return progress;
  }

  private onClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    if (this.preventClick) {
      this.preventClick = undefined;
      return;
    }

    if (this.state.dragging) {
      return;
    }

    this.updateProgress(event);
  };

  private onDragStart = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    const progress = this.updateProgress(event, this.props.changeOnStart);
    this.setState({ dragging: true, dragProgress: progress });

    document.addEventListener('mouseup', this.onDragEnd, false);
    document.addEventListener('mousemove', this.onDragging, false);

    if (this.props.onDragStart) {
      this.props.onDragStart();
    }
  };

  private onDragging = (event: MouseEvent) => {
    const progress = this.updateProgress(event, false);
    this.setState({ dragProgress: progress });

    if (this.props.onDrag) {
      this.props.onDrag(progress);
    }
  };

  private onDragEnd = (event?: MouseEvent) => {
    document.removeEventListener('mouseup', this.onDragEnd as any, false);
    document.removeEventListener('mousemove', this.onDragging, false);

    if (this.props.onChange && typeof this.state.dragProgress === 'number') {
      this.props.onChange(this.state.dragProgress);
    }

    this.setState({ dragging: false, dragProgress: undefined, activeCuePointIndex: undefined });

    if (this.props.onDragEnd) {
      this.props.onDragEnd();
    }

    if (event && event.target && this.rootEl) {
      const target = event.target as HTMLElement;
      if (target === this.rootEl || target.contains(this.rootEl)) {
        this.preventClick = true;
      }
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
