import React, { Component } from 'react'
import { Store } from 'redux'
import { Provider } from 'react-redux'
import { History } from 'history'
import { ConnectedRouter } from 'react-router-redux'
import Routes from '../routes'
import { IAppState } from '../reducers'
import { PersistGate } from 'redux-persist/integration/react'
import { Persistor } from 'redux-persist'

interface IProps {
  store: Store<IAppState>
  history: History
  persistor: Persistor
}

export default class Root extends Component<IProps> {
  render() {
    const { store, history, persistor } = this.props
    return (
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <ConnectedRouter history={history}>
            <Routes />
          </ConnectedRouter>
        </PersistGate>
      </Provider>
    )
  }
}
