import React, { Component } from 'react'
import { SettingsMenu } from '../../settings/SettingsMenu'

export default class Settings extends Component {
  render(): JSX.Element | null {
    return <SettingsMenu invalidate={() => {}} />
  }
}
