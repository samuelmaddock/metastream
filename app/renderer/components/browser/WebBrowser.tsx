import React, { Component } from 'react';
import { DispatchProp } from 'react-redux';
import cx from 'classnames';

import styles from './WebBrowser.css';
import { WEBVIEW_PARTITION } from 'constants/http';
import { WebControls } from 'renderer/components/browser/Controls';
import { netConnect } from 'renderer/lobby';
import { ILobbyNetState } from 'renderer/lobby/reducers';
import { server_requestMedia } from 'renderer/lobby/actions/mediaPlayer';
const { ipcRenderer, remote } = chrome;

const DEFAULT_URL = 'mp://new-tab';
// const DEFAULT_URL = 'https://www.google.com/';
// const DEFAULT_URL = 'data:text/html,<style>html{color:#fff;font-size:36px}</style>B R O W S E R';

interface IProps {
  className?: string;
  initialUrl?: string;
  onClose?: () => void;
}

type PrivateProps = IProps & DispatchProp<ILobbyNetState>;

export class _WebBrowser extends Component<PrivateProps> {
  private webview?: Electron.WebviewTag | null;
  private webviewContents: Electron.webContents;
  private controls?: WebControls | null;

  private hasSetupControls?: boolean;

  private get initialUrl() {
    return this.props.initialUrl || DEFAULT_URL;
  }

  componentDidMount(): void {
    ipcRenderer.on('command', this.dispatchCommand);
  }

  componentWillUnmount(): void {
    ipcRenderer.removeListener('command', this.dispatchCommand);
  }

  private dispatchCommand = (sender: Electron.WebContents, cmd: string) => {
    if (!this.webview) {
      return;
    }

    switch (cmd) {
      case 'window:close':
        if (this.props.onClose) {
          this.props.onClose();
        }
        break;
      case 'window:focus-url':
        if (this.controls) {
          this.controls.focusURL();
        }
        break;
      case 'window:history-prev':
        if (this.webviewContents.canGoBack()) {
          this.webviewContents.goBack();
        }
        break;
      case 'window:history-next':
        if (this.webviewContents.canGoForward()) {
          this.webviewContents.goForward();
        }
        break;
    }
  };

  private setupControls() {
    if (!this.hasSetupControls && this.controls && this.webview && this.webviewContents) {
      this.controls.setWebview(this.webview, this.webviewContents);
      this.hasSetupControls = true;
    }
  }

  private setupWebview = (webview: Electron.WebviewTag | null): void => {
    this.webview = webview;

    if (this.webview) {
      // this.webview.addEventListener('new-window', e => {
      //   TODO: security???
      //   this.webview!.loadURL(e.url);
      // });

      const wv = this.webview as any;
      wv.addEventListener('did-attach', (e: any) => {
        (remote as any).getWebContents(e.tabId, (webContents: Electron.WebContents) => {
          this.webviewContents = webContents;
          this.setupControls();
        });
      });
    }
  };

  render(): JSX.Element {
    return (
      <div className={cx(styles.container, this.props.className)}>
        <WebControls
          ref={el => {
            this.controls = el;
            this.setupControls();
          }}
          initialUrl={this.initialUrl}
          onClose={this.props.onClose}
          onRequestUrl={url => {
            this.props.dispatch!(server_requestMedia(url));

            if (this.props.onClose) {
              this.props.onClose();
            }
          }}
        />
        {this.renderContent()}
      </div>
    );
  }

  private renderContent() {
    // TODO: Remove `is` attribute from webview when React 16 is out
    // https://stackoverflow.com/a/33860892/1490006
    return (
      <webview
        is="is"
        ref={this.setupWebview}
        src={this.initialUrl}
        class={styles.content}
        /* Some website embeds are disabled without an HTTP referrer */
        httpreferrer="http://mediaplayer.samuelmaddock.com/"
        plugins="true"
        partition={WEBVIEW_PARTITION}
        transparent
      />
    );
  }
}

export const WebBrowser = netConnect<{}, {}, IProps>()(_WebBrowser);
