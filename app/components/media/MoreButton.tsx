import React, { Component } from 'react';
import cx from 'classnames';
import { IMediaItem } from 'lobby/reducers/mediaPlayer';
import styles from './MoreButton.css';

import { Icon } from 'components/Icon';

interface IProps {
  className?: string;
  buttonClassName?: string;
}

interface IState {
  isOpen: boolean;
}

export class MoreButton extends Component<IProps> {
  state: IState = {
    isOpen: false
  };

  private renderMenu(): JSX.Element {
    return (
      <div className={styles.menu} onClick={this.onClickMenu}>
        {this.props.children}
      </div>
    );
  }

  render(): JSX.Element | null {
    return (
      <div className={styles.container}>
        <button type="button" className={this.props.buttonClassName} onClick={this.toggleMenu}>
          <Icon name="more-vertical" />
        </button>
        {this.state.isOpen && this.renderMenu()}
      </div>
    );
  }

  private toggleMenu = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  private onClickMenu = () => {
    this.setState({ isOpen: false });
  };
}
