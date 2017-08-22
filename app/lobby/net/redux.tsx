import React, { PropTypes, ReactNode } from 'react'
import { connect, Provider, Store } from 'react-redux'
import { createStore, Middleware, applyMiddleware } from "redux";
import { netReducer, ILobbyNetState } from "lobby/net";
import { netSyncMiddleware, NetMiddlewareOptions } from "lobby/net/middleware/sync";
import { NetServer } from "lobby/types";

export const NET_STORE_NAME = 'netStore';

function customConnect<TStateProps, TDispatchProps, TOwnProps>(...args: any[]) {
  return (Component: any, storeName = NET_STORE_NAME): React.ComponentClass<TOwnProps> => {
    // Return the "normal" connected component from `react-redux`.
    // Then wrap it and pass the store with the custom name as a `prop`,
    // after picking it from `context`.
    const ConnectedComponent = connect(...args)(Component)

    const Wrapper: any = (props: any, context: any) => (
      <ConnectedComponent {...props} store={context[storeName]} />
    );

    Wrapper.displayName = `WrappedConnect(${ConnectedComponent.displayName})`
    Wrapper.contextTypes = {
      [storeName]: PropTypes.object,
    }

    return Wrapper
  };
};

export default customConnect;

const createProvider = require('react-redux').createProvider;
export const NetProvider = createProvider(NET_STORE_NAME) as typeof Provider;

export function createNetStore(opts: NetMiddlewareOptions): Store<ILobbyNetState> {
  const middleware: Middleware[] = [
    netSyncMiddleware(opts)
  ];

  const store = createStore(
    netReducer,
    applyMiddleware(...middleware)
  );

  return store;
}
