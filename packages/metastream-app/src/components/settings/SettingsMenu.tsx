import React, { Component } from 'react'
import styles from './SettingsMenu.css'
import LayoutMain from 'components/layout/Main'
import { MenuHeader } from '../menu/MenuHeader'

import ProfileSettings from './sections/Profile'
import AdvancedSettings from './sections/Advanced'
import ThirdPartySettings from './sections/ThirdParty'
import LanguageSettings from './sections/Language'
import { t } from 'locale'

interface IProps {}

interface State {
  hide?: boolean
}

export class SettingsMenu extends Component<IProps, State> {
  state: State = {}

  /** Force rerender of all children */
  private invalidate = () => {
    this.setState({ hide: true }, () => {
      this.setState({ hide: false })
    })
  }

  render(): JSX.Element | null {
    if (this.state.hide) return null

    return (
      <LayoutMain className={styles.container}>
        <MenuHeader text={t('settings')} />
        <div className={styles.content}>
          <ProfileSettings />
          <AdvancedSettings />
          <LanguageSettings onChange={this.invalidate} />
          <ThirdPartySettings />
        </div>
      </LayoutMain>
    )
  }
}
