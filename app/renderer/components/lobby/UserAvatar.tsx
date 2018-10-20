import React, { Component } from 'react'
import cx from 'classnames'
import { assetUrl } from 'utils/appUrl'
import styles from './UserAvatar.css'

interface IProps {
  className?: string
  avatar?: string
  badge?: string
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
      <div className={cx(this.props.className, styles.container)}>
        <img className={styles.image} src={this.state.src || assetUrl('avatars/default.svg')} />
        {this.props.badge && <img className={styles.badge} src={this.props.badge} />}
      </div>
    )
  }
}
