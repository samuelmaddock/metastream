import React, { Component } from 'react'
import cx from 'classnames'
import { Link } from 'react-router-dom'
import styles from './SettingsMenu.css'
import { NetworkState } from 'types/network'
import { hasValidLicense } from 'renderer/license'

import { ILobbySession } from 'renderer/platform/types'
import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { TextInput, InputGroup } from '../common/input'
import { GoBackButton } from '../menu/GoBackButton'
import { MenuHeader } from '../menu/MenuHeader'

import ProfileSettings from './sections/Profile'
import AdvancedSettings from './sections/Advanced'
import LicenseSettings from './sections/License'

interface IProps {}

export class SettingsMenu extends Component<IProps> {
  render(): JSX.Element | null {
    return (
      <LayoutMain className={styles.container}>
        <GoBackButton />
        <MenuHeader text="Settings" />
        <ProfileSettings />
        <AdvancedSettings />
        {hasValidLicense() ? <LicenseSettings /> : null}
      </LayoutMain>
    )
  }
}
