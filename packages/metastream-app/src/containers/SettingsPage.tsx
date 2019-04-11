import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { SettingsMenu } from '../components/settings/SettingsMenu'
import { IReactReduxProps } from 'types/redux-thunk'

interface IProps extends RouteComponentProps<void> {}

type PrivateProps = IProps & IReactReduxProps

class _SettingsPage extends Component<PrivateProps> {
  render() {
    return <SettingsMenu />
  }
}

export const SettingsPage = connect()(_SettingsPage) as React.ComponentClass<IProps>
