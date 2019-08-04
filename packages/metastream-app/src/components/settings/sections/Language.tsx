import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import { setSetting } from 'actions/settings'
import { IAppState } from 'reducers'
import { ISettingsState } from 'reducers/settings'
import { locales, t, setLocale } from 'locale'
import { Dropdown } from '../controls'
import styles from '../SettingsMenu.css'
import optionsStyles from '../options.css'
import { RouterState } from 'react-router-redux'
import { ExternalLink } from 'components/common/link'

interface IProps {
  onChange: () => void
}

interface IConnectedProps {
  router: RouterState
  settings: ISettingsState
}

type Props = IProps & IConnectedProps & DispatchProp<{}>

class LanguageSettings extends Component<Props> {
  render(): JSX.Element | null {
    // prettier-ignore
    return (
      <section className={styles.section}>
        <label htmlFor="appearance_language">{t('language')}</label>
        <Dropdown
          id="appearance_language"
          onChange={e => {
            const value = (e.target as HTMLSelectElement).value
            this.props.dispatch!(setSetting('language', value))
            setLocale(value)
            this.props.onChange()
          }}
        >
          {locales.map(locale => (
            <option
              key={locale.code}
              value={locale.code}
              selected={locale.code === this.props.settings.language}
            >
              {locale.label} {locale.flag}
            </option>
          ))}
        </Dropdown>
        <p className={styles.small}>
          <span className={optionsStyles.description}>Want to contribute?</span> <ExternalLink className="link-alt" href={`https://github.com/samuelmaddock/metastream/tree/master/packages/metastream-app/src/locale#localization`}>Read localization instructions here.</ExternalLink>
        </p>
      </section>
    )
  }
}

export default connect(
  (state: IAppState): IConnectedProps => {
    return {
      router: state.router,
      settings: state.settings
    }
  }
)(LanguageSettings)
