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

    const port = process.env.PORT || 1212;
    const preload = './preload.js';

    const src = media ? media.url : 'https://www.google.com/';

    const metadata = media && (
      <ul>
        <li>
          <h5>Title:</h5> {media.title}
        </li>
        <li>
          <h5>Duration:</h5> {media.duration}
        </li>
        <li>
          <h5>Requester:</h5> {media.ownerName} ({media.ownerId})
        </li>
        <li>
          <h5>Thumb:</h5> <img src={media.imageUrl} width="80" />
        </li>
      </ul>
    );

    // TODO: Remove `is` attribute from webview when React 16 is out
    // https://stackoverflow.com/a/33860892/1490006
    return (
      <div>
        {metadata}
        <div className={styles.video}>
          <webview
            is="is"
            ref={this.setupWebview}
            src={src}
            class={styles.content}
            /* Some website embeds are disabled without an HTTP referrer */
            httpreferrer="http://mediaplayer.samuelmaddock.com/"
            /* Disable plugins until we know we need them */
            plugins="false"
            preload={preload}
          />
        </div>
        <MediaControls
          onDebug={() => {
            if (this.webview) {
              this.webview.openDevTools();
            }
          }}
        />
      </div>
    );
  }
}
