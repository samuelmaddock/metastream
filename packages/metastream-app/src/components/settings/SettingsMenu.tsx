import React, { PureComponent } from 'react'
import cx from 'classnames'
import styles from './SettingsMenu.css'

import ProfileSettings from './sections/Profile'
import AdvancedSettings from './sections/Advanced'
import LanguageSettings from './sections/Language'

import { t } from 'locale'
import SessionSettings from '../lobby/modals/SessionSettings'

interface IProps {
  inSession?: boolean
  isHost?: boolean
  invalidate: () => void
}

interface State {
  selected?: string
}

interface TabItem {
  label: string
  value: string
  children: () => React.ReactNode
}

export class SettingsMenu extends PureComponent<IProps, State> {
  state: State = {}

  private buildMenu(): TabItem[] {
    const { inSession, isHost } = this.props

    const tabs = [
      inSession &&
        isHost && {
          label: t('session'),
          value: 'session',
          children: () => <SessionSettings />
        },
      !inSession && {
        label: t('profile'),
        value: 'profile',
        children: () => <ProfileSettings />
      },
      {
        label: t('appearance'),
        value: 'appearance',
        children: () => <LanguageSettings onChange={this.props.invalidate} />
      },
      { label: t('advanced'), value: 'advanced', children: () => <AdvancedSettings /> }
    ].filter(Boolean) as TabItem[]

    return tabs
  }

  render() {
    const menu = this.buildMenu()
    const selected = menu.find(item => item.value === this.state.selected) || menu[0]
    const tabs = menu.map(item => (
      <li
        key={item.value}
        className={cx(styles.tabItem, { [styles.selectedTab]: item.value === selected.value })}
      >
        <button
          onClick={() => {
            this.setState({ selected: item.value })
          }}
        >
          {item.label}
        </button>
      </li>
    ))
    const children = typeof selected.children === 'function' ? selected.children() : undefined
    return (
      <div className={cx(styles.container, { [styles.sessionSettings]: this.props.inSession })}>
        <aside className={styles.tabSidebar}>
          <ul>{tabs}</ul>
        </aside>
        <section className={styles.content}>
          <h2>{selected.label}</h2>
          {children}
        </section>
      </div>
    )
  }
}
