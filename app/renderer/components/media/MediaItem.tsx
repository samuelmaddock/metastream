import React, { Component } from 'react'
import { IMediaItem } from 'renderer/lobby/reducers/mediaPlayer'
import styles from './Media.css'
import { formatMs } from 'utils/time'
import { isNumber } from 'utils/type'

import { IconButton } from '../common/button'
import Menu, { MenuItem } from 'material-ui/Menu'

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

    return (
      <figure className={styles.container}>
        <figcaption className={styles.media}>
          <div className={styles.title}>{media.title}</div>
          {isNumber(media.duration) &&
            media.duration !== 0 && (
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
