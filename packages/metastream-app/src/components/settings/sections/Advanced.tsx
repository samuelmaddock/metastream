import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import styles from '../SettingsMenu.css'
import { IAppState } from 'reducers'
import { ISettingsState } from 'reducers/settings'
import { setSetting } from 'actions/settings'
import { SwitchOption } from '../controls'
import { t } from 'locale'

interface IProps {}

interface IConnectedProps {
  settings: ISettingsState
}

type Props = IProps & IConnectedProps & DispatchProp<{}>

class AdvancedSettings extends Component<Props> {
  render(): JSX.Element | null {
    const { dispatch } = this.props
    return (
      <section className={styles.section}>
        <h2>{t('advanced')}</h2>

        <SwitchOption
          inputId="advanced_tracking"
          title={t('allowTracking')}
          description={t('allowTrackingDesc')}
          checked={this.props.settings.allowTracking}
          onChange={checked => dispatch!(setSetting('allowTracking', checked))}
        />

        <SwitchOption
          inputId="advanced_developer"
          title={t('developerMode')}
          description={t('developerModeDesc')}
          checked={this.props.settings.developer}
          onChange={checked => dispatch!(setSetting('developer', checked))}
        />
      </section>
    )
  }
}

export default connect(
  (state: IAppState): IConnectedProps => {
    return {
      settings: state.settings
    }
  }
)(AdvancedSettings) as React.ComponentClass<IProps>
