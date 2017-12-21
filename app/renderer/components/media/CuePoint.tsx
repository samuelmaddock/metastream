import React, { Component } from 'react';
import cx from 'classnames';

import styles from './CuePoint.css';

export type CuePointItem = {
  label?: string;

  /** Time or percentage */
  value: number;
};

interface IProps {
  value: Readonly<CuePointItem>;
  active?: boolean;
  style?: React.CSSProperties;
}

export class CuePoint extends Component<IProps> {
  render(): JSX.Element {
    // TODO: Reveal tooltip on hover
    return (
      <span
        className={cx(styles.container, {
          active: this.props.active
        })}
        style={this.props.style}
        data-title={this.props.value.label}
      />
    );
  }
}
