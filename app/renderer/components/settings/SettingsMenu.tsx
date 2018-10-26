import React, { Component } from 'react'
import styles from './SettingsMenu.css'
import LayoutMain from 'renderer/components/layout/Main'
import { MenuHeader } from '../menu/MenuHeader'

import ProfileSettings from './sections/Profile'
import AdvancedSettings from './sections/Advanced'
import ThirdPartySettings from './sections/ThirdParty'
import { t } from 'locale'

interface IProps {}

export class SettingsMenu extends Component<IProps> {
  render(): JSX.Element | null {
    return (
      <LayoutMain className={styles.container}>
        <MenuHeader text={t('settings')} />
        <div className={styles.content}>
          <ProfileSettings />
          <AdvancedSettings />
          <ThirdPartySettings />
        </div>
      </LayoutMain>
    )
  }
}
