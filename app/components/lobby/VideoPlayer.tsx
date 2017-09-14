import React, { Component } from 'react';
import styles from './VideoPlayer.css';
import { MediaControls } from 'components/lobby/MediaControls';
import { IMediaItem } from 'lobby/reducers/mediaPlayer';

interface IProps {
  media?: IMediaItem;
  startTime?: number;
}

export class VideoPlayer extends Component<IProps> {
  private webview: Electron.WebviewTag | null;

  private setupWebview = (webview: Electron.WebviewTag | null): void => {
    this.webview = webview;
    if (!this.webview) {
      return;
    }

    this.webview.addEventListener('ipc-message', this.onIpcMessage);
  };

  private onIpcMessage = (event: Electron.IpcMessageEvent) => {
    console.log('Received VideoPlayer IPC message', event);

    switch (event.channel) {
      case 'media-ready':
        this.onMediaReady(event);
        break;
    }
  };

  private onMediaReady = (event: Electron.IpcMessageEvent) => {
    const { startTime } = this.props;
    if (startTime) {
      const time = Date.now() - startTime;
      console.log('Sending seek IPC message', time);
      this.webview!.send('media-seek', time);
    }
  };

  render(): JSX.Element | null {
    const { media } = this.props;
    const preload = './preload.js';

    const src = media ? media.url : 'https://www.google.com/';

    // TODO: Remove `is` attribute from webview when React 16 is out
    // https://stackoverflow.com/a/33860892/1490006
    return (
      <div className={styles.container}>
        <webview
          is="is"
          ref={this.setupWebview}
          src={src}
          class={styles.video}
          /* Some website embeds are disabled without an HTTP referrer */
          httpreferrer="http://mediaplayer.samuelmaddock.com/"
          /* Disable plugins until we know we need them */
          plugins="false"
          preload={preload}
        />
        <MediaControls
          reload={() => {
            if (this.webview) {
              this.webview.reload();
            }
          }}
          debug={() => {
            if (this.webview) {
              this.webview.openDevTools();
            }
          }}
        />
      </div>
    );
  }
}
