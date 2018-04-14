import React, { Component, ReactNode } from 'react'
import cx from 'classnames'
import styles from './ListOverlay.css'

interface IProps {
  className?: string
  title?: string
  tagline?: string
  action?: ReactNode
}

export class ListOverlay extends Component<IProps> {
  render(): JSX.Element | null {
    return (
      <div className={cx(this.props.className, styles.container)}>
        <header className={styles.header}>
          <h2 className={styles.title}>{this.props.title}</h2>
          {this.props.tagline && <span className={styles.tagline}>{this.props.tagline}</span>}
          {this.props.action}
        </header>
        <div className={styles.list}>{this.props.children}</div>
      </div>
    )
  }
}
