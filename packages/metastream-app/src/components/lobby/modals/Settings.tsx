import React from 'react'
import { SettingsMenu } from '../../settings/SettingsMenu'
import { LobbyModalProps } from './types'

const Settings: React.SFC<LobbyModalProps> = props => (
  <SettingsMenu invalidate={() => {}} isHost={props.isHost} inSession />
)

export default Settings
