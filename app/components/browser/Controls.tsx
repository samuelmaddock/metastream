import React, { Component } from 'react';
import cx from 'classnames';

import styles from './Controls.css';
import { Icon } from 'components/Icon';

interface IProps {
  className?: string;
  onRequestUrl?: (url: string) => void;
  onClose?: () => void;
}

interface IState {
  url?: string;
}

export class WebControls extends Component<IProps, IState> {
  private webview: Electron.WebviewTag | null;
  private addressInput: HTMLInputElement | null;

  state: IState = {};

  render(): JSX.Element {
    // back, forward, location bar, play button, exit

    return (
      <div className={cx(this.props.className, styles.container)}>
        <Icon name="arrow-left" />
        <Icon name="arrow-right" />
        <Icon name="refresh-cw" />
        <Icon name="home" />
        {this.renderLocation()}
        <button onClick={this.onPlayClicked.bind(this)}>
          <Icon name="play" />
        </button>
        <button onClick={this.onCloseClicked.bind(this)}>
          <Icon name="x" />
        </button>
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
    if (!url.match(/^https?:\/\//i)) {
      url = `https://${url}`;
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
