import React, { Component } from 'react'
import { IMediaItem } from 'lobby/reducers/mediaPlayer'
import styles from './Media.css'
import { formatMs } from 'utils/time'

import { IconButton } from '../common/button'
import { assetUrl } from 'utils/appUrl'

const DEFAULT_FAVICON = assetUrl('icons/favicon-default.svg')

interface IProps {
  media: IMediaItem
  onClickMenu: React.MouseEventHandler<HTMLElement>
}

interface IState {
  anchorEl?: HTMLElement
}

export class MediaItem extends Component<IProps, IState> {
  state: IState = {}

  private get canShowMenu() {
    return true
  }

  render(): JSX.Element | null {
    const { media } = this.props

    let hostname

    try {
      hostname = new URL(media.url).hostname
    } catch {}

    return (
      <figure className={styles.container}>
        <img
          src={media.favicon || DEFAULT_FAVICON}
          className={styles.favicon}
          title={hostname}
          onError={e => {
            if (e.target && (e.target as any).tagName === 'IMG') {
              ;(e.target as any).src = DEFAULT_FAVICON
            }
          }}
        />
        <figcaption className={styles.media}>
          <div className={styles.title} title={media.title}>
            {media.title}
          </div>
          {typeof media.duration === 'number' && media.duration !== 0 && (
            <span className={styles.duration}>{formatMs(media.duration)}</span>
          )}
          {media.ownerName && (
            <div className={styles.authorContainer}>
              <span className={styles.authorLabel}>Added by</span>
              <span className={styles.author}>{media.ownerName}</span>
            </div>
          )}
        </figcaption>
        {this.canShowMenu && (
          <IconButton
            icon="more-vertical"
            className={styles.menuBtn}
            onClick={this.props.onClickMenu}
          />
        )}
      </figure>
    )
  }
}
