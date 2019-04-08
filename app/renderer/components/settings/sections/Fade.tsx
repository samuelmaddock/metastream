import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import { setSetting } from 'renderer/actions/settings'
import { IAppState } from 'renderer/reducers/index'
import { ISettingsState } from 'renderer/reducers/settings'
import { t } from '../../../../locale/index'
import { Dropdown } from '../controls'
import styles from '../SettingsMenu.css'
import optionsStyles from '../options.css'
import { RouterState } from 'react-router-redux'
import { ExternalLink } from 'renderer/components/common/link'

interface IProps {}

interface IConnectedProps {
  router: RouterState
  settings: ISettingsState
}

type Props = IProps & IConnectedProps & DispatchProp<{}>

class FadeSettings extends Component<Props> {
  render(): JSX.Element | null {
    // prettier-ignore
    return (
      <section className={styles.section}>
        <h2>{t('fade')}</h2>

        <Dropdown
          onChange={e => {
            const value = (e.target as HTMLSelectElement).value
            this.props.dispatch!(setSetting('fade', parseInt(value)))
          }}
        >
        
          <option
            key='10s'
            value={10000}
            selected={10000 === this.props.settings.fade}
          >
            {t('fade10Seconds')}
          </option>

          <option
            key='20s'
            value={20000}
            selected={20000 === this.props.settings.fade}
          >
            {t('fade20Seconds')}
          </option>

          <option
            key='30s'
            value={30000}
            selected={30000 === this.props.settings.fade}
          >
            {t('fade30Seconds')}
          </option>

          <option
            key='forever'
            value={9999999999999999}
            selected={9999999999999999 === this.props.settings.fade}
          >
            {t('fadeForever')}
          </option>
          
        </Dropdown>

        <div className={optionsStyles.description}>{t('fadeDescription')}</div>
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
)(FadeSettings)
