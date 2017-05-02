import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import * as cfgStore from './store/configureStore';
import './app.global.css';

const { configureStore, history } = cfgStore;
const store = configureStore();

function initSteam() {
  let steamworks: any;
  try {
    steamworks = require('greenworks');
  } catch (e) {
    console.log('Failed to load steamworks');
    console.error(e);
    steamworks = null;
  }
  console.log('steamworks', steamworks);
}

initSteam();

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root');
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
