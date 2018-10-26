import React, { Component } from 'react'
import cx from 'classnames'
import { assetUrl } from 'utils/appUrl'
import styles from './UserAvatar.css'

interface IProps {
  className?: string
  avatar?: string
  badge?: string

  selected?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
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

  private requestAvatar(src: string) {
    let img = new Image()
    img.onload = () => this.setState({ src })
    img.src = src
  }

  render(): JSX.Element | null {
    const { onClick } = this.props

    const children = (
      <>
        <img className={styles.image} src={this.state.src || assetUrl('avatars/default.svg')} />
        {this.props.badge && <img className={styles.badge} src={this.props.badge} />}
      </>
    )

    return React.createElement(
      onClick ? 'button' : 'div',
      {
        className: cx(this.props.className, styles.container, {
          [styles.selected]: this.props.selected
        }),
        onClick
      },
      children
    )
  }
}
