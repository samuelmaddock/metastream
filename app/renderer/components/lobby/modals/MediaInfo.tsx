import React, { Component } from 'react'
import styles from './MediaInfo.css'
import { IMediaItem } from 'renderer/lobby/reducers/mediaPlayer'

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

    if (!media) {
      return null
    }

    // TODO: render parsed media description
    return <div className={styles.container}>{media.description}</div>
  }
}
