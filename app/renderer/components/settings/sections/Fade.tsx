import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import { setSetting } from 'renderer/actions/settings'
import { IAppState } from 'renderer/reducers/index'
import { ISettingsState } from 'renderer/reducers/settings'
import { t } from '../../../../locale/index'
import { NumberBox, SwitchOption } from '../controls'
import styles from '../SettingsMenu.css'
import optionsStyles from '../options.css'
import { RouterState } from 'react-router-redux'

interface IProps {}

interface IConnectedProps {
  router: RouterState
  settings: ISettingsState
}

type Props = IProps & IConnectedProps & DispatchProp<{}>

interface State {
  numBoxDisabled: boolean
}

class FadeSettings extends Component<Props, State> {
  state: State = {
    numBoxDisabled: this.props.settings.fade >= 1000000000000000
  }

  render(): JSX.Element | null {
    // prettier-ignore
    return (
      <section className={styles.section}>
        <h2>{t('fade')}</h2>

        <NumberBox
          value={(this.props.settings.fade / 1000)} 
          onChange={e => {
            let value = parseInt((e.target as HTMLInputElement).value)
            if (value < 1) {
              (e.target as HTMLInputElement).value = '1'
              value = 1
            }
            this.props.dispatch!(setSetting('fade', value * 1000))
          }}
          disabled={this.state.numBoxDisabled}
        />

        <div className={optionsStyles.description}>{t('fadeDescription')}</div>

        <SwitchOption 
          inputId='fadeForever'
          title={t('fadeForever')}
          description={t('fadeForeverDescription')}
          checked={this.props.settings.fade >= 1000000000000000}
          onChange={checked => {
            if (checked) {
              this.props.dispatch!(setSetting('fade', 1000000000000000))
              this.setState({ numBoxDisabled: true })
            } else {
              this.props.dispatch!(setSetting('fade', 10000))
              this.setState({ numBoxDisabled: false })
            }
          }}
        />
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
