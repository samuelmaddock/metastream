import React, { Component } from 'react';
import cx from 'classnames';
import { IMediaItem } from 'renderer/lobby/reducers/mediaPlayer';
import styles from './InfoButton.css';

import { Icon } from 'renderer/components/Icon';

interface IProps {
  className?: string;
  buttonClassName?: string;
  media: IMediaItem;
}

interface IState {
  isOpen: boolean;
}

export class InfoButton extends Component<IProps> {
  private menu: HTMLElement | null;

  state: IState = {
    isOpen: false
  };

  componentWillUnmount(): void {
    if (this.state.isOpen) {
      this.close();
    }
  }

  private renderMenu(): JSX.Element {
    return (
      <div
        ref={e => {
          this.menu = e;
        }}
        className={styles.menu}
      >
        {this.props.media.description}
      </div>
    );
  }

  render(): JSX.Element | null {
    return (
      <div className={styles.container}>
        <button type="button" className={this.props.buttonClassName} onClick={this.toggleMenu}>
          <Icon name="info" />
        </button>
        {this.state.isOpen && this.renderMenu()}
      </div>
    );
  }

  open() {
    this.setState({ isOpen: true });
  }

  close() {
    this.setState({ isOpen: false });
  }

  private toggleMenu = () => {
    this.state.isOpen ? this.close() : this.open();
  };

  private onDocumentClick = (event: MouseEvent) => {
    this.close();
  };
}
