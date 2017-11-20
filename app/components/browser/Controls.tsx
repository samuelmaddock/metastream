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
            onChange={() => {}}
          />
        </div>
      </div>
    );
  }

  setWebview(webview: Electron.WebviewTag | null) {
    this.webview = webview;

    if (this.webview) {
      this.webview.addEventListener('dom-ready', e => {
        if (this.addressInput && this.webview) {
          this.addressInput.value = this.webview.getURL();
        }
      });

      this.webview.addEventListener('will-navigate', e => {
        if (this.addressInput && this.webview) {
          this.addressInput.value = e.url;
        }
      });
    }
  }

  private onLocationKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      const target = event.target as HTMLInputElement;

      if (this.webview && target) {
        this.webview.loadURL(target.value);
      }
    }
  };

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
