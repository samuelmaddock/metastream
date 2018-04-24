import React, { Component } from 'react'
import styles from './SettingsMenu.css'
import { Icon } from 'renderer/components/Icon'
import { TextInput, InputGroup } from '../common/input'
import { IAppState } from '../../reducers/index'
import { getLocalUsername, getLocalColor, ISettingsState } from '../../reducers/settings'
import { connect, DispatchProp } from 'react-redux'
import { USERNAME_MIN_LEN, USERNAME_MAX_LEN } from '../../../constants/settings'
import { setUsername, setColor, setSetting } from '../../actions/settings'
import { SwitchOption } from './controls'

interface IProps {}

interface IConnectedProps {
  settings: ISettingsState
}

type Props = IProps & IConnectedProps & DispatchProp<{}>

class AdvancedSettings extends Component<Props> {
  render(): JSX.Element | null {
    const { dispatch } = this.props
    return (
      <section className={styles.section}>
        <h2>Advanced</h2>

        <SwitchOption
          inputId="advanced_tracking"
          title="Allow Tracking"
          description="Send app usage information to the developer."
          checked={this.props.settings.allowTracking}
          onChange={checked => dispatch!(setSetting('allowTracking', checked))}
        />

        <SwitchOption
          inputId="advanced_developer"
          title="Developer Mode"
          description="Show developer tools for inspecting web pages."
          checked={this.props.settings.developer}
          onChange={checked => dispatch!(setSetting('developer', checked))}
        />
      </section>
    )
  }
}

export default connect((state: IAppState): IConnectedProps => {
  return {
    settings: state.settings
  }
})(AdvancedSettings) as React.ComponentClass<IProps>
