import React, { Component } from 'react';
import styles from './VideoPlayer.css';

interface IProps {
  src?: string;
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
  };

  render(): JSX.Element | null {
    const port = process.env.PORT || 1212;
    const preload = './preload.js';

    const src = this.props.src || 'https://www.github.com/';

    return (
      <div>
        <div className={styles.video}>
          <webview
            ref={this.setupWebview}
            src={src}
            className={styles.content}
            /* Some website embeds are disabled without an HTTP referrer */
            httpreferrer="http://samuelmaddock.com/"
            /* Disable plugins until we know we need them */
            plugins="false"
            preload={preload}
          />
        </div>
        <div>
          <button
            onClick={() => {
              this.webview!.openDevTools();
            }}
          >
            Debug
          </button>
        </div>
      </div>
    );
  }
}
