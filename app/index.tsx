import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import * as cfgStore from './store/configureStore';
import './app.global.css';
import { steamworks } from 'steam';

const electron = window.require('electron');
const process = window.require('process');

let store: any;
let history: any;

function initSteam(): Steamworks.API | null {
  // Activate UV loop for async workers
  // https://github.com/greenheartgames/greenworks#general-greenworks-gotchas
  process.activateUvLoop();

  if (!steamworks) {
    return null;
  }

  console.info(`Initializing Steamworks (Greenworks ${steamworks._version})...`);
  if (steamworks.initAPI()) {
    console.info('Successfully initialized Steamworks');
  } else {
    console.error('Failed to initialize Steamworks');
    return null;
  }

  // DEBUG
  (global as any).steamworks = steamworks;

  return steamworks;
}

function init() {
  // Disable Steam by default in development
  const useSteam = PRODUCTION ? true : process.env.WITH_STEAM;

  let steamworks;

  if (useSteam) {
    steamworks = initSteam();

    if (!steamworks) {
      alert('Failed to initialize Steamworks');
      electron.remote.app.exit();
      return;
    }
  }

  const extra = { steamworks };

  history = cfgStore.history;
  store = cfgStore.configureStore(extra);

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
  app.steamworks = steamworks;
  (window as any).app = app;
}

init();

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
