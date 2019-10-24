import React, { Component } from 'react'
import styles from './MediaInfo.css'
import { IMediaItem } from 'lobby/reducers/mediaPlayer'
import { parseDescription, ParseToken } from '../../../media/description'
import { LinkText, TimestampLinkText } from '../../common/typography'
import { TimestampButton } from '../../media/TimestampButton'

interface IProps {
  media?: IMediaItem
  onClose?: Function
}

export default class MediaInfo extends Component<IProps> {
  componentDidUpdate() {
    this.checkValid()
  }

  private checkValid() {
    if (!this.props.media) {
      this.props.onClose && this.props.onClose()
    }
  }

  render(): JSX.Element | null {
    const { media } = this.props
    if (!media) return null

    const { description } = media
    if (!description) return null

    const fragments = parseDescription(description)

    const children = fragments.map((fragment, idx) => {
      switch (fragment.type) {
        case ParseToken.TEXT:
          return fragment.content
        case ParseToken.TIMESTAMP:
          return <TimestampButton key={idx} timestamp={fragment.content} />
        case ParseToken.LINK:
          return (
            <LinkText key={idx} href={fragment.content} target="_blank" rel="nofollow noopener">
              {fragment.content}
            </LinkText>
          )
      }
    })
    return <div className={styles.container}>{children}</div>
  }
}
