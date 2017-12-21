import React, { Component } from 'react';

/** Time before user is considered inactive */
const INACTIVE_DURATION = 3000;

interface IProps {
  onChange: (active: boolean) => void;
}

export class ActivityMonitor extends Component<IProps> {
  private _active: boolean = true;
  private isMouseDown?: boolean;
  private activityTimeoutId?: number;

  get active() {
    return this._active;
  }

  set active(state: boolean) {
    if (this._active !== state) {
      this._active = state;
      this.props.onChange(this._active);
    }
  }

  componentDidMount(): void {
    document.addEventListener('mousedown', this.onMouseDown, false);
    document.addEventListener('mouseup', this.onMouseUp, false);
    document.addEventListener('mousemove', this.onActivity, false);
    document.addEventListener('mousewheel', this.onActivity, false);
    document.addEventListener('keydown', this.onActivity, false);
  }

  componentWillUnmount(): void {
    document.removeEventListener('mousedown', this.onMouseDown, false);
    document.removeEventListener('mouseup', this.onMouseUp, false);
    document.removeEventListener('mousemove', this.onActivity, false);
    document.removeEventListener('mousewheel', this.onActivity, false);
    document.removeEventListener('keydown', this.onActivity, false);

    if (this.activityTimeoutId) {
      clearTimeout(this.activityTimeoutId);
      this.activityTimeoutId = undefined;
    }
  }

  private onActivityTimeout = (): void => {
    this.active = false;
    this.activityTimeoutId = undefined;
  };

  private onActivity = (): void => {
    this.active = true;

    if (this.activityTimeoutId) {
      clearTimeout(this.activityTimeoutId);
    }

    if (!this.isMouseDown) {
      this.activityTimeoutId = setTimeout(this.onActivityTimeout, INACTIVE_DURATION) as any;
    }
  };

  /** Don't go inactive while mouse is held down; useful for scrolling */
  private onMouseDown = (): void => {
    this.isMouseDown = true;
    this.onActivity();
  };

  private onMouseUp = (): void => {
    this.isMouseDown = false;
    this.onActivity();
  };

  render(): JSX.Element | null {
    return null;
  }
}
