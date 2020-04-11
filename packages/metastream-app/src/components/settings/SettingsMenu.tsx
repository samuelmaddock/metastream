import React, { PureComponent } from 'react'
import cx from 'classnames'
import styles from './SettingsMenu.css'

import ProfileSettings from './sections/Profile'
import AdvancedSettings from './sections/Advanced'
import AppearanceSettings from './sections/Appearance'

import { t } from 'locale'
import SessionSettings from '../lobby/modals/SessionSettings'
import { IReactReduxProps } from '../../types/redux-thunk'
import { ISettingsState } from '../../reducers/settings'
import { IAppState } from '../../reducers/index'
import { connect } from 'react-redux'
import { setSetting } from '../../actions/settings'
import { SettingsProps } from './types'
import { DonateBar } from 'components/account/DonateBar'

interface IProps {
  inSession?: boolean
  isHost?: boolean
  invalidate: () => void
  initialSelected?: string
}

interface IConnectedProps {
  settings: ISettingsState
}

interface DispatchProps {
  setSetting: typeof setSetting
}

interface State {
  selected?: string
}

interface TabItem {
  label: string
  value: string
  children: () => React.ReactNode
}

type Props = IProps & IConnectedProps & DispatchProps & IReactReduxProps

class _SettingsMenu extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      selected: props.initialSelected
    }
  }

  private buildMenu(): TabItem[] {
    const { inSession, isHost } = this.props

    const settingsProps: SettingsProps = {
      settings: this.props.settings,
      setSetting: this.props.setSetting
    }

    const tabs = [
      {
        label: t('profile'),
        value: 'profile',
        children: () => <ProfileSettings {...settingsProps} />
      },
      inSession && {
        label: t('session'),
        value: 'session',
        children: () => <SessionSettings className={styles.section} />
      },
      {
        label: t('appearance'),
        value: 'appearance',
        children: () => <AppearanceSettings onChange={this.props.invalidate} {...settingsProps} />
      },
      {
        label: t('advanced'),
        value: 'advanced',
        children: () => <AdvancedSettings {...settingsProps} />
      }
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
      <div
        className={cx(styles.container, {
          [styles.sessionSettings]: this.props.inSession,
          transparent: this.props.inSession
        })}
      >
        <div className={styles.columns}>
          <aside className={styles.tabSidebar}>
            <ul>{tabs}</ul>
          </aside>
          <section className={styles.content}>
            <h2>{selected.label}</h2>
            {children}
          </section>
        </div>
        <DonateBar className={styles.bottom} />
      </div>
    )
  }
}

export const SettingsMenu = (connect(
  (state: IAppState): IConnectedProps => {
    return {
      settings: state.settings
    }
  },
  dispatch => {
    const bindSetSetting: typeof setSetting = (key, value) => {
      return dispatch(setSetting(key, value))
    }

    return {
      setSetting: bindSetSetting
    }
  }
)(_SettingsMenu) as any) as React.ComponentClass<IProps>
