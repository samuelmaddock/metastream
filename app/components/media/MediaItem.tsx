import React, { Component } from 'react';
import { IMediaItem } from 'lobby/reducers/mediaPlayer';
import styles from './Media.css';
import { formatMs } from 'utils/time';

interface IProps {
  media: IMediaItem;
}

export class MediaItem extends Component<IProps> {
  render(): JSX.Element | null {
    const { media } = this.props;

    return (
      <figure className={styles.media}>
        <div className={styles.title}>{media.title}</div>
        {media.duration && <span className={styles.duration}>{formatMs(media.duration)}</span>}
        {media.ownerName && (
          <div>
            <span className={styles.authorLabel}>Added by</span>
            <span className={styles.author}>{media.ownerName}</span>
          </div>
        )}
      </figure>
    );
  }
}
