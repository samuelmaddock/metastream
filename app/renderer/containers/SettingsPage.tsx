import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { IReactReduxProps } from 'types/redux';

import { IAppState } from 'renderer/reducers';

import { ServerBrowser } from 'renderer/components/ServerBrowser';
import { requestLobbies } from 'renderer/actions/lobby';
import { NetworkState } from 'types/network';
import { ILobbySession } from 'renderer/platform/types';
import { SessionJoin } from '../components/SessionJoin';
import { push } from 'react-router-redux';
import { SettingsMenu } from '../components/settings/SettingsMenu';

interface IProps extends RouteComponentProps<void> {}

type PrivateProps = IProps & IReactReduxProps;

class _SettingsPage extends Component<PrivateProps> {
  render() {
    return <SettingsMenu />;
  }
}

export const SettingsPage = connect()(_SettingsPage) as React.ComponentClass<IProps>;
