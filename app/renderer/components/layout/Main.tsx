import React, { Component } from 'react'
import cx from 'classnames'
import { TitleBar } from 'renderer/components/TitleBar'
import styles from './Main.css'

interface IProps {
  className?: string
}

export default class LayoutMain extends Component<IProps> {
  render() {
    return (
      <div className={styles.container}>
        <TitleBar className={styles.titleBar} />
        <main className={cx(this.props.className, styles.content)}>{this.props.children}</main>
      </div>
    )
  }
}
