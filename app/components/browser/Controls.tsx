import React, { Component } from 'react';
import cx from 'classnames';

import { Icon } from 'components/Icon';
import { IconButton } from 'components/common/button';

import styles from './Controls.css';

interface IProps {
  initialUrl: string;
  className?: string;
  onRequestUrl?: (url: string) => void;
  onClose?: () => void;
}

interface IState {
  url?: string;
  loading?: boolean;
}

export class WebControls extends Component<IProps, IState> {
  private webview: Electron.WebviewTag | null;
  private addressInput: HTMLInputElement | null;

  state: IState = {};

  render(): JSX.Element {
    // back, forward, location bar, play button, exit

    const backBtn = (
      <IconButton
        className={styles.button}
        icon="arrow-left"
        onClick={() => {
          if (this.webview) {
            this.webview.goBack();
          }
        }}
        disabled={this.webview ? !this.webview.canGoBack() : true}
      />
    );

    const forwardBtn = (
      <IconButton
        className={styles.button}
        icon="arrow-right"
        onClick={() => {
          if (this.webview) {
            this.webview.goForward();
          }
        }}
        disabled={this.webview ? !this.webview.canGoForward() : true}
      />
    );

    const refreshBtn = (
      <IconButton
        className={styles.button}
        icon={this.state.loading ? 'x' : 'refresh-cw'}
        onClick={e => {
          if (this.webview) {
            if (this.state.loading) {
              this.webview.stop();
            } else if (e.shiftKey) {
              this.webview.reloadIgnoringCache();
            } else {
              this.webview.reload();
            }
          }
        }}
      />
    );

    const homeBtn = (
      <IconButton
        className={styles.button}
        icon="home"
        onClick={e => {
          if (this.webview) {
            // TODO: navigate forward instead of back
            this.webview.goToIndex(0);
          }
        }}
      />
    );

    const playBtn = (
      <IconButton className={styles.button} icon="play" onClick={this.onPlayClicked.bind(this)} />
    );
    const closeBtn = (
      <IconButton className={styles.button} icon="x" onClick={this.onCloseClicked.bind(this)} />
    );

    return (
      <div className={cx(this.props.className, styles.container)}>
        {backBtn}
        {forwardBtn}
        {refreshBtn}
        {homeBtn}
        {this.renderLocation()}
        {playBtn}
        {closeBtn}
      </div>
    );
  }

  private renderLocation(): JSX.Element {
    return (
      <div className={styles.locationContainer}>
        <div className={styles.locationBar}>
          <input
            ref={el => {
              this.addressInput = el;
            }}
            type="text"
            className={styles.addressInput}
            onKeyPress={this.onLocationKeyPress}
            onChange={() => {
              /* force react controlled input */
            }}
            autoFocus
          />
        </div>
      </div>
    );
  }

  setWebview(webview: Electron.WebviewTag | null) {
    this.webview = webview;

    if (this.webview) {
      this.webview.addEventListener('dom-ready', e => {
        if (this.webview) {
          this.updateURL(this.webview.getURL());
        }
      });

      const updateUrl = (e: { url: string }) => {
        this.updateURL(e.url);
      };

      this.webview.addEventListener('will-navigate', updateUrl);
      this.webview.addEventListener('did-navigate-in-page', updateUrl);

      const setLoading = (loading: boolean) => this.setState({ loading });
      this.webview.addEventListener('did-start-loading', setLoading.bind(null, true));
      this.webview.addEventListener('did-stop-loading', setLoading.bind(null, false));
      this.webview.addEventListener('did-finish-load', setLoading.bind(null, false));
    }
  }

  focusURL() {
    if (this.addressInput) {
      this.addressInput.focus();
      this.addressInput.select();
    }
  }

  private updateURL(url: string) {
    // TODO: add custom 'mediaplayer://' protocol for internal pages
    if (url.startsWith('asar://') || url.endsWith('/homescreen.html')) {
      url = '';
    }

    if (this.addressInput) {
      this.addressInput.value = url;
    }
  }

  private onLocationKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      const { onRequestUrl } = this.props;
      const target = event.target as HTMLInputElement;

      if (target) {
        const url = target.value;
        const shouldRequest = event.ctrlKey || event.shiftKey || event.altKey;

        if (onRequestUrl && shouldRequest) {
          onRequestUrl(url);
        } else {
          this.loadURL(url);
          this.webview!.focus();
        }
      }
    }
  };

  private loadURL(url: string) {
    // TODO: make this robust
    if (!url.match(/^\w+?:\/\//i)) {
      url = `http://${url}`;
    }

    if (this.webview) {
      this.webview.loadURL(url);
    }
  }

  private onPlayClicked() {
    const { onRequestUrl } = this.props;
    const url = this.webview && this.webview.getURL();

    if (onRequestUrl && url) {
      onRequestUrl(url);
    }
  }

  private onCloseClicked() {
    const { onClose } = this.props;

    if (onClose) {
      onClose();
    }
  }
}
