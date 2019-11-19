import React, { Component } from 'react'
import { RouteComponentProps } from 'react-router'

import styles from './WelcomePage.css'

import LayoutMain from 'components/layout/Main'
import { MenuButton } from 'components/menu/MenuButton'
import { t } from 'locale'
import { SwitchOption } from '../components/settings/controls'
import { connect } from 'react-redux'
import { IAppState } from '../reducers'
import { ISettingsState } from '../reducers/settings'
import { TextInput } from '../components/common/input'
import { USERNAME_MAX_LEN } from 'constants/settings'
import { MenuHeader } from '../components/menu/MenuHeader'
import { replace } from 'react-router-redux'
import { setUsername, setSetting } from '../actions/settings'
import { PRODUCT_NAME } from 'constants/app'
import { IReactReduxProps } from '../types/redux-thunk'

interface IProps extends RouteComponentProps<any> {}

interface IConnectedProps {
  pathname: string
  settings: ISettingsState
}

type Props = IProps & IConnectedProps & IReactReduxProps

class WelcomePage extends Component<Props> {
  // Design: https://venturebeat.com/wp-content/uploads/2015/03/Slack-test-start.png
  render(): JSX.Element | null {
    const { dispatch } = this.props

    const submit = () => {
      localStorage.setItem('welcomed', 'true')
      dispatch(replace(this.props.pathname))
    }

    return (
      <LayoutMain className={styles.container}>
        <form
          className={styles.column}
          onSubmit={e => {
            e.preventDefault()
            submit()
          }}
        >
          <MenuHeader text={`Welcome to ${PRODUCT_NAME}`} />

          <div className={styles.formControl}>
            <label htmlFor="profile_username">{t('chooseDisplayName')}</label>
            <TextInput
              id="profile_username"
              autoComplete="username"
              placeholder={t('required')}
              spellCheck={false}
              defaultValue={this.props.settings.username}
              maxLength={USERNAME_MAX_LEN}
              onChange={e => {
                const username = (e.target as HTMLInputElement).value
                if (username) {
                  dispatch(setUsername(username))
                }
              }}
              onBlur={e => {
                if (this.props.settings.username) {
                  ;(e.target as HTMLInputElement).value = this.props.settings.username
                }
              }}
              autoFocus
            />
          </div>

          <SwitchOption
            inputId="advanced_tracking"
            title={t('allowTracking')}
            description={t('allowTrackingDesc')}
            checked={this.props.settings.allowTracking}
            onChange={checked => dispatch(setSetting('allowTracking', checked))}
            className={styles.formControl}
            divider={false}
          />

          <MenuButton icon="check-circle" onClick={submit}>
            {t('getStarted')}
          </MenuButton>
        </form>
      </LayoutMain>
    )
  }
}

export default connect(
  (state: IAppState): IConnectedProps => {
    const { location } = state.router
    return {
      pathname: location ? location.pathname : '/',
      settings: state.settings
    }
  }
)(WelcomePage)
