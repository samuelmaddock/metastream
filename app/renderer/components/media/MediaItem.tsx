import React, { Component } from 'react'
import { IMediaItem } from 'renderer/lobby/reducers/mediaPlayer'
import styles from './Media.css'
import { formatMs } from 'utils/time'
import { isNumber } from 'utils/type'

import { IconButton } from '../common/button'
import Menu, { MenuItem } from 'material-ui/Menu'

interface IProps {
  media: IMediaItem
  onClick: () => void
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
            <div>
              <span className={styles.authorLabel}>Added by</span>
              <span className={styles.author}>{media.ownerName}</span>
            </div>
          )}
        </figcaption>
        {this.canShowMenu && (
          <IconButton icon="more-vertical" className={styles.menuBtn} onClick={this.handleClick} />
        )}
        {this.canShowMenu && this.renderMenu()}
      </figure>
    )
  }

  private renderMenu() {
    const { anchorEl } = this.state
    return (
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={this.handleClose}
      >
        {/*
      TODO:
      - media info
      - copy link
      - open in browser
      - remove (admin only)
      - move menus up to parent component?
      */}
        <MenuItem onClick={this.props.onClick} dense>
          Remove
        </MenuItem>
      </Menu>
    )
  }

  private handleClick = (event: React.MouseEvent<HTMLElement>) => {
    this.setState({ anchorEl: event.target as HTMLElement })
  }

  private handleClose = () => {
    this.setState({ anchorEl: undefined })
  }
}
