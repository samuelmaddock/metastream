import React, { Component } from 'react';
import { Store } from 'redux';
import { Provider } from 'react-redux';
import { History } from 'history';
import { ConnectedRouter } from 'react-router-redux';
import Routes from '../routes';

interface IProps {
  store: Store<any>; // TODO: type this
  history: History;
}

export default class Root extends Component<IProps> {
  render() {
    const { store, history } = this.props;
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <Routes />
        </ConnectedRouter>
      </Provider>
    );
  }
}
