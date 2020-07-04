import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import { setSetting } from 'actions/settings'
import { IAppState } from 'reducers'
import { ISettingsState } from 'reducers/settings'
import { locales, t, setLocale } from 'locale'
import { Dropdown, SwitchOption } from '../controls'
import styles from '../SettingsMenu.css'
import optionsStyles from '../options.css'
import { ExternalLink } from 'components/common/link'
import { SettingsProps } from '../types'
import { ChatLocation } from '../../chat/Location'
import { LanguageSetting } from '../Language'

interface Props extends SettingsProps {
  onChange: () => void
}

export default class AppearanceSettings extends Component<Props> {
  render() {
    const { setSetting, settings } = this.props
    // prettier-ignore
    return (
      <section className={styles.section}>
        <LanguageSetting onChange={this.props.onChange} />
        <p className={styles.small}>
          <span className={optionsStyles.description}>Want to contribute?</span> <ExternalLink className="link-alt" href={`https://github.com/samuelmaddock/metastream/tree/master/packages/metastream-app/src/locale#localization`}>Read localization instructions here.</ExternalLink>
        </p>

        <SwitchOption
          inputId="autofullscreen"
          title={t('autoFullscreen')}
          description={t('autoFullscreenDesc')}
          checked={settings.autoFullscreen}
          onChange={checked => setSetting('autoFullscreen', checked)}
        />

        <SwitchOption
          inputId="theatermode"
          title={t('theaterMode')}
          description={t('theaterModeDesc')}
          checked={settings.theaterMode}
          onChange={checked => setSetting('theaterMode', checked)}
        />

        <SwitchOption
          inputId="dock_chat"
          title={t('uiDockToRight')}
          checked={settings.chatLocation === ChatLocation.DockRight}
          onChange={checked => setSetting('chatLocation', location =>
            location === ChatLocation.DockRight ? ChatLocation.FloatLeft : ChatLocation.DockRight
          )}
        />

        <SwitchOption
          inputId="chat_timestamp"
          title={t('chatTimestamp')}
          description={t('chatTimestampDesc')}
          checked={settings.chatTimestamp}
          onChange={checked => setSetting('chatTimestamp', checked)}
        />
      </section>
    )
  }
}
