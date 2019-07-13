import React from 'react'
import { noop } from 'lodash-es'

interface Props {
  playing: boolean
  muted: boolean
}

/**
 * Renders empty video to allow registering Media Session API.
 */
export class MediaSession extends React.PureComponent<Props> {
  private video: HTMLMediaElement | null = null

  componentDidUpdate(prevProps: Props) {
    if (prevProps.playing !== this.props.playing) {
      this.updatePlayback()
    }
  }

  updatePlayback() {
    if (!this.video) return
    if (this.props.playing) {
      this.video.play().catch(noop)
    } else {
      this.video.pause()
    }
  }

  render() {
    return (
      <video
        ref={video => {
          this.video = video
          this.updatePlayback()
        }}
        src="/mediasession.mp4"
        loop
        muted={this.props.muted}
        style={{ display: 'none' }}
      />
    )
  }
}
