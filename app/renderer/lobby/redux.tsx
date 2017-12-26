import React, { ReactNode } from 'react';
import PropTypes from 'prop-types';
import { createStore, Middleware, applyMiddleware } from 'redux';
import { connect, Provider, Store, createProvider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';

import { NetMiddlewareOptions, netSyncMiddleware } from 'renderer/network/middleware/sync';
import { netRpcMiddleware } from 'renderer/network/middleware/rpc';

import { netReducer, ILobbyNetState } from './';
import { usersMiddleware } from './middleware/users';
import { sessionMiddleware } from './middleware/session';

export const NET_STORE_NAME = 'netStore';

function customConnect<TStateProps, TDispatchProps, TOwnProps>(...args: any[]) {
  return (Component: any, storeName = NET_STORE_NAME): React.ComponentClass<TOwnProps> => {
    // Return the "normal" connected component from `react-redux`.
    // Then wrap it and pass the store with the custom name as a `prop`,
    // after picking it from `context`.
    const ConnectedComponent = connect(...args)(Component);

    const Wrapper: any = (props: any, context: any) => (
      <ConnectedComponent {...props} store={context[storeName]} />
    );

    Wrapper.displayName = `WrappedConnect(${ConnectedComponent.displayName})`;
    Wrapper.contextTypes = {
      [storeName]: PropTypes.object
    };

    return Wrapper;
  };
}

export default customConnect;

export const NetProvider = createProvider(NET_STORE_NAME) as typeof Provider;

export function createNetStore(opts: NetMiddlewareOptions): Store<ILobbyNetState> {
  const middleware: Middleware[] = [
    netRpcMiddleware(opts),
    netSyncMiddleware(opts),
    usersMiddleware(opts),
    sessionMiddleware(opts),
    thunkMiddleware
  ];

  const store = createStore(netReducer, applyMiddleware(...middleware));

  return store;
}
