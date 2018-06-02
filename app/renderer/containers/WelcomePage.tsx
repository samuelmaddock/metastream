import React, { Component } from 'react'
import { Redirect, RouteComponentProps } from 'react-router'
import { Link } from 'react-router-dom'

import styles from './WelcomePage.css'

import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { t } from '../../locale/index'
import Input from 'material-ui/Input/Input'
import { SwitchOption } from '../components/settings/controls'
import { connect, DispatchProp } from 'react-redux'
import { IAppState } from '../reducers/index'
import { ISettingsState } from '../reducers/settings'
import { TextInput } from '../components/common/input'
import { USERNAME_MAX_LEN } from '../../constants/settings'
import { MenuHeader } from '../components/menu/MenuHeader'
import { replace } from 'react-router-redux'
import { setUsername, setSetting } from '../actions/settings'

const { productName } = require('package.json')

interface IProps extends RouteComponentProps<any> {}

interface IConnectedProps {
  settings: ISettingsState
}

type Props = IProps & IConnectedProps & DispatchProp<any>

class WelcomePage extends Component<Props> {
  // Design: https://venturebeat.com/wp-content/uploads/2015/03/Slack-test-start.png
  render(): JSX.Element | null {
    const dispatch = this.props.dispatch!
    return (
      <LayoutMain className={styles.container}>
        <section className={styles.column}>
          <MenuHeader text={`Welcome to ${productName}`} />
          <label htmlFor="profile_username">{t('chooseUsername')}</label>
          <TextInput
            id="profile_username"
            defaultValue={this.props.settings.username}
            maxLength={USERNAME_MAX_LEN}
            onChange={e => {
              const username = (e.target as HTMLInputElement).value
              dispatch(setUsername(username))
            }}
            onBlur={e => {
              ;(e.target as HTMLInputElement).value = this.props.settings.username!
            }}
          />
          <div>
            <SwitchOption
              inputId="advanced_tracking"
              title={t('allowTracking')}
              description={t('allowTrackingDesc')}
              checked={this.props.settings.allowTracking}
              onChange={checked => dispatch(setSetting('allowTracking', checked))}
            />
          </div>
          <MenuButton
            icon="check-circle"
            onClick={() => {
              localStorage.setItem('welcomed', 'true')
              this.props.dispatch!(replace('/'))
            }}
          >
            {t('getStarted')}
          </MenuButton>
        </section>
      </LayoutMain>
    )
  }
}

export default connect((state: IAppState): IConnectedProps => {
  return {
    settings: state.settings
  }
})(WelcomePage)
