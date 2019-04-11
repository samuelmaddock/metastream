import React, { Component } from 'react'
import { connect } from 'react-redux'
import styles from '../SettingsMenu.css'
import { IAppState } from 'reducers'
import { setSetting } from 'actions/settings'
import { t } from 'locale'
import { SwitchOption } from '../controls'
import { IReactReduxProps } from 'types/redux-thunk'

interface IProps {}

interface IConnectedProps {
  discordPresence: boolean
}

type Props = IProps & IConnectedProps & IReactReduxProps

class ThirdPartySettings extends Component<Props> {
  render(): JSX.Element | null {
    return (
      <section className={styles.section}>
        <h2>{t('thirdPartyIntegrations')}</h2>

        <SwitchOption
          inputId="discord_rp"
          title="Discord Rich Presence"
          description={t('discordPresenceDescription')}
          checked={this.props.discordPresence}
          onChange={checked => this.props.dispatch(setSetting('discordPresence', checked))}
        />
      </section>
    )
  }
}

export default connect(
  (state: IAppState): IConnectedProps => {
    return {
      discordPresence: state.settings.discordPresence
    }
  }
)(ThirdPartySettings)
