import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'

import { IAppState } from '../../reducers/index'
import { IMediaItem } from '../../lobby/reducers/mediaPlayer'
import { getCurrentMedia, getMediaQueue } from '../../lobby/reducers/mediaPlayer.helpers'
import { server_requestDeleteMedia, server_requestMedia } from '../../lobby/actions/mediaPlayer'

import { HighlightButton } from '../common/button'
import { ListOverlay } from './ListOverlay'
import { t } from '../../../locale/index'

import { MenuItem } from 'material-ui/Menu'
import { MediaItem } from '../media/MediaItem'
import { openInBrowser } from '../../../utils/url'
import { copyToClipboard } from '../../../utils/clipboard'
import { isHost } from '../../lobby/reducers/users.helpers'

interface IProps {
  className?: string
  onAddMedia(): void
  onShowInfo(media?: IMediaItem): void
}

interface IConnectedProps {
  isHost?: boolean
  currentMedia?: IMediaItem
  mediaQueue: IMediaItem[]
}

type Props = IProps & IConnectedProps & DispatchProp<IAppState>

class _MediaList extends Component<Props> {
  private listOverlay: ListOverlay<IMediaItem> | null = null

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
        ref={e => (this.listOverlay = e)}
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
        renderMenuOptions={(media: IMediaItem, close) => {
          let items = [
            {
              label: t('openInBrowser'),
              onClick: () => openInBrowser(media.requestUrl)
            },
            {
              label: t('copyLink'),
              onClick: () => copyToClipboard(media.requestUrl)
            },
            {
              label: t('info'),
              onClick: () => this.props.onShowInfo(media)
            }
          ]

          if (this.props.isHost) {
            items = items.concat([
              {
                label: t('duplicate'),
                onClick: () => this.props.dispatch!(server_requestMedia(media.requestUrl))
              },
              {
                label: t('remove'),
                onClick: () => this.props.dispatch!(server_requestDeleteMedia(media.id))
              }
            ])
          }

          return (
            <>
              {items.map((item, idx) => (
                <MenuItem
                  key={idx}
                  onClick={() => {
                    item.onClick()
                    close()
                  }}
                  dense
                >
                  {item.label}
                </MenuItem>
              ))}
            </>
          )
        }}
      >
        {mediaList.map(media => {
          return (
            <MediaItem
              key={media.id}
              media={media}
              onClickMenu={e => {
                this.listOverlay!.onSelect(e, media)
              }}
            />
          )
        })}
      </ListOverlay>
    )
  }

  private renderMenu() {}
}

export const MediaList = connect(
  (state: IAppState): IConnectedProps => ({
    isHost: isHost(state),
    currentMedia: getCurrentMedia(state),
    mediaQueue: getMediaQueue(state)
  })
)(_MediaList) as React.ComponentClass<IProps>
