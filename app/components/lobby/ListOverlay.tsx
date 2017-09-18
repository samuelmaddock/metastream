import React, { Component } from 'react';
import cx from 'classnames';
import styles from './ListOverlay.css';

interface IProps {
  className?: string;
  title?: string;
  tagline?: string;
}

export class ListOverlay extends Component<IProps> {
  render(): JSX.Element | null {
    return (
      <div className={cx(this.props.className, styles.container)}>
        <header className={styles.header}>
          <h2 className={styles.title}>{this.props.title}</h2>
          <span className={styles.tagline}>{this.props.tagline}</span>
        </header>
        <div className={styles.list}>{this.props.children}</div>
      </div>
    );
  }
}
