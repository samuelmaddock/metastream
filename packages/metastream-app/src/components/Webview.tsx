import React, { Component } from 'react'

interface Props {
  src?: string
  className?: string
  componentRef?: (c: Webview | null) => any
}

export class Webview extends Component<Props> {
  private iframe: HTMLIFrameElement | null = null

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy */
  private get featurePolicy() {
    // prettier-ignore
    return [
      'midi',
      'fullscreen',
      'animations',
      'picture-in-picture',
      'encrypted-media',
      'autoplay'
    ].map(feature => `${feature} *`).join(', ')
  }

  render() {
    const { componentRef, ...rest } = this.props

    return (
      <iframe
        ref={e => {
          this.iframe = e
          if (componentRef) {
            componentRef(e ? this : null)
          }
        }}
        allow={this.featurePolicy}
        {...rest}
      />
    )
  }

  loadURL(url: string, opts: { httpReferrer: string; userAgent: string }) {
    // TODO
  }

  addEventListener(eventName: string, listener: Function) {
    // TODO
  }
}
