import React, { Component } from 'react';
import { IUser } from 'lobby/reducers/users';
import styles from './UserItem.css';
import { PlatformService } from 'platform';
import { NetUniqueId } from 'network';

interface IProps {
  className?: string;

  /** User ID */
  id: string;
}

interface IState {
  src?: string;
}

export class UserAvatar extends Component<IProps> {
  private mounted?: boolean;

  state: IState = {};

  componentWillMount(): void {
    this.requestAvatar(this.props.id);
    this.mounted = true;
  }

  componentWillUnmount(): void {
    this.mounted = false;
  }

  componentWillReceiveProps(nextProps: IProps): void {
    if (this.props.id !== nextProps.id) {
      this.requestAvatar(nextProps.id);
    }
  }

  private async requestAvatar(id: string) {
    let src;
    try {
      src = await PlatformService.requestAvatarUrl(id);
    } catch (e) {
      return;
    }
    this.setState({ src });
  }

  private onImageLoad = () => {
    const { src } = this.state;
    if (src) {
      URL.revokeObjectURL(src);
    }
  };

  render(): JSX.Element | null {
    return <img src={this.state.src} onLoad={this.onImageLoad} className={this.props.className} />;
  }
}
