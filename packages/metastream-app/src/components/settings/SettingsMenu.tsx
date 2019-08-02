import React, { Component } from 'react'
import styles from './SettingsMenu.css'

import ProfileSettings from './sections/Profile'
import AdvancedSettings from './sections/Advanced'
import LanguageSettings from './sections/Language'

interface IProps {
  invalidate: () => void
}

export class SettingsMenu extends Component<IProps> {
  render() {
    return (
      <div className={styles.content}>
        <ProfileSettings />
        <LanguageSettings onChange={this.props.invalidate} />
        <AdvancedSettings />
      </div>
    )
  }
}
