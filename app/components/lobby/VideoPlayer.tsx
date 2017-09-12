import React, { Component } from 'react';
import styles from './VideoPlayer.css';

interface IProps {
  src?: string;
}

export class VideoPlayer extends Component<IProps> {
  render(): JSX.Element | null {
    const src = this.props.src || 'http://samuelmaddock.com/';

    return (
      <div className={styles.container}>
        <webview src={src} className={styles.content} />
      </div>
    );
  }
}
