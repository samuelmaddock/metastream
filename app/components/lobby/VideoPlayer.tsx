import React, { Component } from 'react';
import styles from './VideoPlayer.css';

interface IProps {}

export class VideoPlayer extends Component<IProps> {
  render(): JSX.Element | null {
    return (
      <div className={styles.container}>
        <webview src="http://samuelmaddock.com/" className={styles.content} />
      </div>
    );
  }
}
