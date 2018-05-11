import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import styles from '../SettingsMenu.css'
import { Icon } from 'renderer/components/Icon'
import { TextInput, InputGroup } from 'renderer/components/common/input'
import { IAppState } from 'renderer/reducers/index'
import { getLocalUsername, getLocalColor, ISettingsState } from 'renderer/reducers/settings'
import { USERNAME_MIN_LEN, USERNAME_MAX_LEN } from 'constants/settings'
import { setUsername, setColor, setSetting } from 'renderer/actions/settings'
import { SwitchOption } from '../controls'
import { MenuButton } from '../../menu/MenuButton'
import { removeLicense, hasValidLicense } from 'renderer/license'
import { t } from '../../../../locale/index'

interface IProps {}

interface IConnectedProps {
  settings: ISettingsState
}

type Props = IProps & IConnectedProps & DispatchProp<{}>

class LicenseSettings extends Component<Props> {
  render(): JSX.Element | null {
    if (!hasValidLicense()) return null

    const { dispatch } = this.props
    return (
      <section className={styles.section}>
        <h2>{t('license')}</h2>

        <MenuButton
          size="medium"
          onClick={() => {
            removeLicense()
            this.forceUpdate()
          }}
        >
          {t('removeLicense')}
        </MenuButton>
      </section>
    )
  }
}

export default connect((state: IAppState): IConnectedProps => {
  return {
    settings: state.settings
  }
})(LicenseSettings) as React.ComponentClass<IProps>
