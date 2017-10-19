import React, { Component } from 'react';
import styles from './CuePoint.css';

export type CuePointItem = {
  label?: string;

  /** Time or percentage */
  value: number;
};

interface IProps {
  value: Readonly<CuePointItem>;
  style?: React.CSSProperties;
}

export class CuePoint extends Component<IProps> {
  render(): JSX.Element {
    // TODO: Reveal tooltip on hover
    return <span className={styles.container} style={this.props.style} />;
  }
}
