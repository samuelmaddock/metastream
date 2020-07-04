import React, { Component, ReactNode } from 'react'
import cx from 'classnames'
import styles from './ListOverlay.css'

import Menu from '@material-ui/core/Menu'
import { PanelHeader } from './PanelHeader'

interface IProps<T> {
  id: string
  className?: string
  title?: string
  tagline?: string
  action?: ReactNode
  placeholder?: ReactNode
  renderMenuOptions: (item: T, onClose: Function) => ReactNode
}

interface IState<T> {
  menuOpen: boolean
  selection?: T
  menuAnchorEl?: HTMLElement
}

export class ListOverlay<T = any> extends Component<IProps<T>, IState<T>> {
  state: IState<T> = { menuOpen: false }

  render(): JSX.Element | null {
    return (
      <div
        id={this.props.id}
        className={cx(this.props.className, styles.container, {
          active: this.state.menuOpen
        })}
      >
        <PanelHeader
          title={this.props.title}
          tagline={this.props.tagline}
          action={this.props.action}
        />
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
    const { menuAnchorEl, selection, menuOpen: open } = this.state
    return (
      <Menu anchorEl={menuAnchorEl} open={open} onClose={this.handleClose} disableScrollLock>
        {selection && this.props.renderMenuOptions(selection, this.handleClose)}
      </Menu>
    )
  }

  private handleClose = () => {
    this.setState({ menuOpen: false })
  }

  onSelect = (e: React.MouseEvent<HTMLElement>, selection: T) => {
    if (!e.target) return

    // 'instanceof' does not work with constructors in another window. Need to
    // account for elements rendered in popups
    let targetWindow: typeof window
    try {
      targetWindow = (e.target as any).ownerDocument.defaultView
      if (targetWindow.constructor.name !== 'Window') return
    } catch {
      return
    }

    if (
      e.target instanceof targetWindow.HTMLElement ||
      e.target instanceof targetWindow.SVGElement
    ) {
      this.setState({ menuOpen: true, selection, menuAnchorEl: e.target as any })
    }
  }
}
