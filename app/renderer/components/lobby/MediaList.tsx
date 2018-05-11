import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'

import { IAppState } from '../../reducers/index'
import { IMediaItem } from '../../lobby/reducers/mediaPlayer'
import { getCurrentMedia, getMediaQueue } from '../../lobby/reducers/mediaPlayer.helpers'
import { server_requestDeleteMedia } from '../../lobby/actions/mediaPlayer'

import { HighlightButton } from '../common/button'
import { ListOverlay } from './ListOverlay'
import { MediaItem } from '../media/MediaItem'
import { t } from '../../../locale/index'

interface IProps {
  className?: string
  onAddMedia(): void
}

interface IConnectedProps {
  currentMedia?: IMediaItem
  mediaQueue: IMediaItem[]
}

type Props = IProps & IConnectedProps & DispatchProp<IAppState>

class _MediaList extends Component<Props> {
  private get hasRequested() {
    return (parseInt(localStorage.getItem('requestCount') || '0', 10) || 0) > 0
  }

  render(): JSX.Element | null {
    const { mediaQueue, currentMedia } = this.props

    const mediaList =
      currentMedia && currentMedia.hasMore ? [currentMedia, ...mediaQueue] : mediaQueue
    const isEmpty = mediaList.length === 0

    return (
      <ListOverlay
        className={this.props.className}
        title={t('nextUp')}
        tagline={this.props.mediaQueue.length ? `${this.props.mediaQueue.length}` : undefined}
        action={
          <HighlightButton
            icon="plus"
            highlight={(!currentMedia && isEmpty) || !this.hasRequested}
            onClick={() => {
              if (this.props.onAddMedia) {
                this.props.onAddMedia()
              }
            }}
          >
            {t('add')}
          </HighlightButton>
        }
      >
        {mediaList.map(media => {
          return (
            <MediaItem
              key={media.id}
              media={media}
              onClick={() => {
                this.props.dispatch!(server_requestDeleteMedia(media.id))
              }}
            />
          )
        })}
      </ListOverlay>
    )
  }
}

export const MediaList = connect((state: IAppState): IConnectedProps => {
  return {
    currentMedia: getCurrentMedia(state),
    mediaQueue: getMediaQueue(state)
  }
})(_MediaList) as React.ComponentClass<IProps>
