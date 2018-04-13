import React, { Component } from 'react'
import styles from './SettingsMenu.css'
import { Icon } from 'renderer/components/Icon'
import { TextInput, InputGroup } from '../common/input'
import { IAppState } from '../../reducers/index'
import { getLocalUsername } from '../../reducers/settings'
import { connect, DispatchProp } from 'react-redux'
import { USERNAME_MIN_LEN, USERNAME_MAX_LEN } from '../../../constants/settings'
import { setUsername } from '../../actions/settings'

interface IProps {}

interface IConnectedProps {
  username: string
}

type Props = IProps & IConnectedProps & DispatchProp<{}>

class _ProfileSettings extends Component<Props> {
  private usernameInput: HTMLInputElement | null = null

  private get username() {
    return this.usernameInput && this.usernameInput.value
  }

  render(): JSX.Element | null {
    return (
      <section className={styles.section}>
        <h2>PROFILE</h2>
        <TextInput
          theRef={e => (this.usernameInput = e)}
          defaultValue={this.props.username}
          maxLength={USERNAME_MAX_LEN}
          onChange={this.onChangeUsername}
        />
      </section>
    )
  }

  // TODO: debounce
  private onChangeUsername = () => {
    const { username } = this
    if (!username) return

    this.props.dispatch!(setUsername(username))
  }
}

export const ProfileSettings = connect((state: IAppState): IConnectedProps => {
  return {
    username: getLocalUsername(state)
  }
})(_ProfileSettings) as React.ComponentClass<IProps>
