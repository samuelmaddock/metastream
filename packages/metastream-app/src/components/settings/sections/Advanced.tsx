import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import styles from '../SettingsMenu.css'
import { IAppState } from 'reducers'
import { ISettingsState } from 'reducers/settings'
import { setSetting } from 'actions/settings'
import { SwitchOption } from '../controls'
import { t } from 'locale'
import { SettingsProps } from '../types'

export default class AdvancedSettings extends Component<SettingsProps> {
  render(): JSX.Element | null {
    return (
      <section className={styles.section}>
        <SwitchOption
          inputId="safebrowse"
          title={t('safeBrowse')}
          description={t('safeBrowseDesc')}
          checked={this.props.settings.safeBrowse}
          onChange={checked => this.props.setSetting('safeBrowse', checked)}
        />
        <SwitchOption
          inputId="advanced_tracking"
          title={t('allowTracking')}
          description={t('allowTrackingDesc')}
          checked={this.props.settings.allowTracking}
          onChange={checked => this.props.setSetting('allowTracking', checked)}
        />
      </section>
    )
  }
}
