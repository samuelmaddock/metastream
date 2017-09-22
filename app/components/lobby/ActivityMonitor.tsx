import { platform } from 'os';
import { remote } from 'electron';
import React, { Component } from 'react';
import cx from 'classnames';
import styles from './TitleBar.css';

/** Time before user is considered inactive */
const INACTIVE_DURATION = 3000;

interface IProps {
  onChange: (active: boolean) => void;
}

export class ActivityMonitor extends Component<IProps> {
  private _active: boolean = true;
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
    document.addEventListener('mousemove', this.onMouseMove, false);
  }

  componentWillUnmount(): void {
    document.removeEventListener('mousemove', this.onMouseMove, false);

    if (this.activityTimeoutId) {
      clearTimeout(this.activityTimeoutId);
      this.activityTimeoutId = undefined;
    }
  }

  private onActivityTimeout = (): void => {
    this.active = false;
    this.activityTimeoutId = undefined;
  };

  private onMouseMove = (): void => {
    this.active = true;

    if (this.activityTimeoutId) {
      clearTimeout(this.activityTimeoutId);
    }

    this.activityTimeoutId = setTimeout(this.onActivityTimeout, INACTIVE_DURATION) as any;
  };

  render(): JSX.Element | null {
    return null;
  }
}
