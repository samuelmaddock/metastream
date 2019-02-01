import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import { setSetting } from 'renderer/actions/settings'
import { IAppState } from 'renderer/reducers/index'
import { ISettingsState } from 'renderer/reducers/settings'
import { locales, t, setLocale } from '../../../../locale/index'
import { Dropdown } from '../controls'
import styles from '../SettingsMenu.css'
import optionsStyles from '../options.css'
import { RouterState } from 'react-router-redux'
import { ExternalLink } from 'renderer/components/common/link'

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
        <h2>{t('language')}</h2>

        <Dropdown
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
          <span className={optionsStyles.description}>Want to contribute?</span> <ExternalLink className="link-alt" href={`https://github.com/samuelmaddock/metastream/tree/master/app/locale`}>Read localization instructions here.</ExternalLink>
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
