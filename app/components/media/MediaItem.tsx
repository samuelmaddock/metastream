import React, { Component } from 'react';
import { IMediaItem } from 'lobby/reducers/mediaPlayer';
import styles from './Media.css';

interface IProps {
  media: IMediaItem;
}

export class MediaItem extends Component<IProps> {
  render(): JSX.Element | null {
    const { media } = this.props;

    return (
      <figure className={styles.media}>
        {media.imageUrl && (
          <div className={styles.thumbnail} style={{ backgroundImage: `url(${media.imageUrl})` }} />
        )}
        <figcaption className={styles.caption}>
          <span>{media.title}</span>
          <span>{media.duration}</span>
          <span>{media.ownerName}</span>
        </figcaption>
      </figure>
    );
  }
}
