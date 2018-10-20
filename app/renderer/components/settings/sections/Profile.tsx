import React, { Component } from 'react'
import { connect, DispatchProp } from 'react-redux'
import styles from '../SettingsMenu.css'
import { Icon } from 'renderer/components/Icon'
import { TextInput, InputGroup } from 'renderer/components/common/input'
import { IAppState } from 'renderer/reducers/index'
import { getLocalUsername, getLocalColor, ISettingsState } from 'renderer/reducers/settings'
import { USERNAME_MIN_LEN, USERNAME_MAX_LEN } from 'constants/settings'
import { setUsername, setColor, setSetting } from 'renderer/actions/settings'
import { t } from '../../../../locale/index'
import { avatarRegistry } from '../../../services/avatar'
import { UserAvatar } from '../../lobby/UserAvatar'

interface IProps {}

interface IConnectedProps {
  avatar?: string
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
        <h2>{t('profile')}</h2>

        <label>{t('avatar')}</label>
        <div className={styles.avatarList}>
          {avatarRegistry.getAll().map((avatar, idx) => (
            <UserAvatar
              key={idx}
              avatar={avatar.src}
              selected={avatar.uri === this.props.avatar}
              onClick={() => {
                this.props.dispatch!(setSetting('avatar', avatar.uri))
              }}
            />
          ))}
        </div>

        <label htmlFor="profile_username">{t('username')}</label>
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

        <label htmlFor="profile_color">{t('chatColor')}</label>
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

export default connect(
  (state: IAppState): IConnectedProps => {
    return {
      avatar: state.settings.avatar,
      username: getLocalUsername(state),
      color: getLocalColor(state)
    }
  }
)(ProfileSettings) as React.ComponentClass<IProps>
