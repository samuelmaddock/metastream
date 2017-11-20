import React, { Component } from 'react';
import cx from 'classnames';

import styles from './Controls.css';
import { Icon } from 'components/Icon';

interface IProps {
  className?: string;
}

export class WebControls extends Component<IProps> {
  render(): JSX.Element {
    // back, forward, location bar, play button, exit

    return (
      <div className={cx(this.props.className, styles.container)}>
        <Icon name="arrow-left" />
        <Icon name="arrow-right" />
        <Icon name="refresh-cw" />
        <Icon name="home" />
        {this.renderLocation()}
        <Icon name="play" />
        <Icon name="x" />
      </div>
    );
  }

  private renderLocation(): JSX.Element {
    return (
      <div className={styles.locationContainer}>
        <div className={styles.locationBar}>
          <input
            type="text"
            className={styles.addressInput}
            defaultValue="http://www.google.com/"
          />
        </div>
      </div>
    );
  }
}
