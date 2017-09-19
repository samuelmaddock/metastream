import { platform } from 'os';
import { remote } from 'electron';
import React, { Component } from 'react';
import cx from 'classnames';
import styles from './TitleBar.css';

interface IProps {
  className?: string;
  title?: string;
}

export class TitleBar extends Component<IProps> {
  get window() {
    return remote.getCurrentWindow();
  }

  render(): JSX.Element | null {
    return (
      <div className={cx(this.props.className, styles.container)}>
        <div className={styles.wrapper}>
          <header className={styles.header}>
            <h2 className={styles.title}>{this.props.title || 'Media Player'}</h2>
          </header>
          {platform() === 'win32' && this.renderWin32Actions()}
        </div>
      </div>
    );
  }

  private renderWin32Actions(): JSX.Element {
    const buttons = [
      {
        label: '0', // 🗕
        action: () => this.window.minimize()
      },
      {
        label: this.window.isMaximized() ? '1' : '2', // 🗖
        action: () => {
          if (this.window.isMaximized()) {
            this.window.restore();
          } else if (this.window.isMinimizable()) {
            this.window.maximize();
          }
          this.forceUpdate();
        }
      },
      {
        label: 'r', // ✕
        action: () => this.window.close()
      }
    ];

    return (
      <div className={styles.actions}>
        {buttons.map(btn => (
          <button type="button" className={styles.actionButton} onClick={btn.action}>
            {btn.label}
          </button>
        ))}
      </div>
    );
  }
}
