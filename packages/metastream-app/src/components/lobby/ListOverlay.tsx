import React, { Component, ReactNode } from 'react'
import cx from 'classnames'
import styles from './ListOverlay.css'

import Menu from 'material-ui/Menu'

interface IProps<T> {
  className?: string
  title?: string
  tagline?: string
  action?: ReactNode
  placeholder?: ReactNode
  renderMenuOptions: (item: T, onClose: Function) => ReactNode
}

interface IState<T> {
  selection?: T
  menuAnchorEl?: HTMLElement
}

export class ListOverlay<T = any> extends Component<IProps<T>, IState<T>> {
  state: IState<T> = {}

  render(): JSX.Element | null {
    return (
      <div
        className={cx(this.props.className, styles.container, {
          [styles.active]: !!this.state.menuAnchorEl
        })}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>{this.props.title}</h2>
          {this.props.tagline && <span className={styles.tagline}>{this.props.tagline}</span>}
          <div className={styles.actions}>{this.props.action}</div>
        </header>
        <div className={styles.list}>
          {React.Children.count(this.props.children) > 0 ? (
            this.props.children
          ) : (
            <div className={styles.placeholder}>{this.props.placeholder}</div>
          )}
        </div>
        {this.renderMenu()}
      </div>
    )
  }

  private renderMenu() {
    const { menuAnchorEl, selection } = this.state
    return (
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={this.handleClose}>
        {selection && this.props.renderMenuOptions(selection, this.handleClose)}
      </Menu>
    )
  }

  private handleClose = () => {
    this.setState({ menuAnchorEl: undefined })
  }

  onSelect = (e: React.MouseEvent<HTMLElement>, selection: T) => {
    if (e.target instanceof HTMLElement || e.target instanceof SVGElement) {
      this.setState({ selection, menuAnchorEl: e.target as any })
    }
  }
}
