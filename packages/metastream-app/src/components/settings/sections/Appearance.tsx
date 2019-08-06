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

interface Props extends SettingsProps {
  onChange: () => void
}

export default class AppearanceSettings extends Component<Props> {
  render() {
    const { setSetting, settings } = this.props
    // prettier-ignore
    return (
      <section className={styles.section}>
        <label htmlFor="appearance_language">{t('language')}</label>
        <Dropdown
          id="appearance_language"
          onChange={e => {
            const value = (e.target as HTMLSelectElement).value
            setSetting('language', value)
            setLocale(value)
            this.props.onChange()
          }}
        >
          {locales.map(locale => (
            <option
              key={locale.code}
              value={locale.code}
              selected={locale.code === settings.language}
            >
              {locale.label} {locale.flag}
            </option>
          ))}
        </Dropdown>
        <p className={styles.small}>
          <span className={optionsStyles.description}>Want to contribute?</span> <ExternalLink className="link-alt" href={`https://github.com/samuelmaddock/metastream/tree/master/packages/metastream-app/src/locale#localization`}>Read localization instructions here.</ExternalLink>
        </p>

        <SwitchOption
          inputId="dock_chat"
          title={t('chatDockToRight')}
          checked={settings.chatLocation === ChatLocation.DockRight}
          onChange={checked => setSetting('chatLocation', location =>
            location === ChatLocation.DockRight ? ChatLocation.FloatLeft : ChatLocation.DockRight
          )}
        />

        <SwitchOption
          inputId="autofullscreen"
          title={"Auto-fullscreen"}
          description="Zoom to fit active video within the window frame."
          checked={settings.autoFullscreen}
          onChange={checked => setSetting('autoFullscreen', checked)}
        />

        <SwitchOption
          inputId="theatermode"
          title={"Theater Mode"}
          description="Hides all non-video elements on the page."
          checked={settings.theaterMode}
          onChange={checked => setSetting('theaterMode', checked)}
        />
      </section>
    )
  }
}
