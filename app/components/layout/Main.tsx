import React, { Component } from 'react';
import cx from 'classnames';
import { TitleBar } from 'components/TitleBar';
import styles from './Main.css';

interface IProps {
  className?: string;
}

export default class LayoutMain extends Component<IProps> {
  render() {
    return (
      <div className={this.props.className}>
        <TitleBar />
        <main className={styles.content}>{this.props.children}</main>
      </div>
    );
  }
}
