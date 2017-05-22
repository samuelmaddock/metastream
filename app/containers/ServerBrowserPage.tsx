import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { IReactReduxProps } from 'types/redux';

import { IAppState } from "reducers";

import { ServerBrowser } from 'components/ServerBrowser';
import { requestLobbies, ILobbyRequestResult } from 'actions/steamworks';
import { NetworkState } from "types/network";

interface IProps extends RouteComponentProps<void> {
}

interface IConnectedProps {
  network: NetworkState;
  lobbies?: ILobbyRequestResult[];
}

function mapStateToProps(state: IAppState): IConnectedProps {
  return {
    network: state.lobby.network,
    lobbies: state.lobby.list
  };
}

interface IDispatchProps {
  // refresh:
}

// function mapDispatchToProps(dispatch: any):

type PrivateProps = IProps & IConnectedProps & IReactReduxProps;

export class _ServerBrowserPage extends Component<PrivateProps, void> {
  componentDidMount(): void {
    if (this.props.network === NetworkState.Uninitialized) {
      this.props.dispatch(requestLobbies());
    }
  }

  render() {
    const { network, lobbies } = this.props;
    return (
      <ServerBrowser
        network={network}
        list={lobbies}
        refresh={() => {}} />
    );
  }
}

export const ServerBrowserPage = connect<IConnectedProps, {}, IProps>(mapStateToProps)(_ServerBrowserPage);
