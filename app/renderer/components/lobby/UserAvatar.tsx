import React, { Component } from 'react'
import { IUser } from 'renderer/lobby/reducers/users'
import styles from './UserItem.css'
import { PlatformService } from 'renderer/platform'
import { NetUniqueId } from 'renderer/network'
import { assetUrl } from 'utils/appUrl'

interface IProps {
  className?: string

  /** User ID */
  id: string

  avatar?: string
}

interface IState {
  src?: string
}

export class UserAvatar extends Component<IProps> {
  state: IState = {}

  componentWillMount(): void {
    if (this.props.avatar) {
      this.requestAvatar(this.props.avatar)
    }
  }

  componentWillReceiveProps(nextProps: IProps): void {
    if (nextProps.avatar && this.props.avatar !== nextProps.avatar) {
      this.requestAvatar(nextProps.avatar)
    }
  }

  private async requestAvatar(src: string) {
    let img = new Image()
    img.onload = () => {
      this.setState({ src })
    }
    img.src = src
  }

  render(): JSX.Element | null {
    return (
      <img src={this.state.src || assetUrl('icons/avatar.svg')} className={this.props.className} />
    )
  }
}
