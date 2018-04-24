import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import styles from '../SettingsMenu.css'
import { Icon } from 'renderer/components/Icon'
import { TextInput, InputGroup } from 'renderer/components/common/input'
import { IAppState } from 'renderer/reducers/index'
import { getLocalUsername, getLocalColor, ISettingsState } from 'renderer/reducers/settings'
import { USERNAME_MIN_LEN, USERNAME_MAX_LEN } from 'constants/settings'
import { setUsername, setColor, setSetting } from 'renderer/actions/settings'

interface IProps {}

interface IConnectedProps {
  username: string
  color: string
}

type Props = IProps & IConnectedProps & DispatchProp<{}>

class ProfileSettings extends Component<Props> {
  private usernameInput: HTMLInputElement | null = null

  private get username() {
    return this.usernameInput && this.usernameInput.value
  }

  render(): JSX.Element | null {
    return (
      <section className={styles.section}>
        <h2>Profile</h2>

        <label htmlFor="profile_username">Username</label>
        <TextInput
          id="profile_username"
          theRef={e => (this.usernameInput = e)}
          defaultValue={this.props.username}
          maxLength={USERNAME_MAX_LEN}
          onChange={this.onChangeUsername}
          onBlur={e => {
            if (this.usernameInput) {
              this.usernameInput.value = this.props.username
            }
          }}
        />

        <label htmlFor="profile_color">Chat Color</label>
        <input
          id="profile_color"
          type="color"
          className={styles.colorSwatch}
          defaultValue={this.props.color}
          onChange={e => this.props.dispatch!(setColor(e.target!.value))}
        />
      </section>
    )
  }

  // TODO: debounce
  private onChangeUsername = () => {
    const { username } = this
    if (!username) return

    if (username !== this.props.username) {
      this.props.dispatch!(setUsername(username))
    }
  }
}

export default connect((state: IAppState): IConnectedProps => {
  return {
    username: getLocalUsername(state),
    color: getLocalColor(state)
  }
})(ProfileSettings) as React.ComponentClass<IProps>
