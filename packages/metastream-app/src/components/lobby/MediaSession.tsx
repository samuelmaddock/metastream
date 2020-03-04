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
      try {
        this.video.play().catch(noop)
      } catch {
        // "Disable HTML5 Autoplay" extension prevents `play()` from returning
        // a promise.
        // https://chrome.google.com/webstore/detail/disable-html5-autoplay/efdhoaajjjgckpbkoglidkeendpkolai
      }
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
