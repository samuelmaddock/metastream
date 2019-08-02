import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { SettingsMenu } from '../components/settings/SettingsMenu'
import { IReactReduxProps } from 'types/redux-thunk'

import LayoutMain from 'components/layout/Main'
import { MenuHeader } from 'components/menu/MenuHeader'
import { t } from 'locale'

import styles from './SettingsPage.css'

interface IProps extends RouteComponentProps<void> {}

interface State {
  hide?: boolean
}

type PrivateProps = IProps & IReactReduxProps

class _SettingsPage extends Component<PrivateProps, State> {
  state: State = {}

  /** Force rerender of all children */
  private invalidate = () => {
    this.setState({ hide: true }, () => {
      this.setState({ hide: false })
    })
  }

  render() {
    if (this.state.hide) return null
    return (
      <LayoutMain className={styles.container}>
        <MenuHeader text={t('settings')} />
        <SettingsMenu invalidate={this.invalidate} />
      </LayoutMain>
    )
  }
}

export const SettingsPage = connect()(_SettingsPage) as React.ComponentClass<IProps>
