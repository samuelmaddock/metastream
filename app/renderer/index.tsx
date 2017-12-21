import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import * as cfgStore from 'renderer/store/configureStore';
import './app.global.css';

const { productName } = require('./package.json');

const electron = window.require('electron');
const process = window.require('process');

let store: any;
let history: any;

function init() {
  // Set default title
  document.title = productName;

  history = cfgStore.history;
  store = cfgStore.configureStore();

  render(
    <AppContainer>
      <Root store={store} history={history} />
    </AppContainer>,
    document.getElementById('root'),
    function() {
      console.info('Render complete', arguments);
    }
  );

  // DEBUG
  const app = Object.create(null);
  app.store = store;
  (window as any).app = app;
}

init();

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
