import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import * as cfgStore from './store/configureStore';
import './app.global.css';

const electron = window.require('electron');

const { configureStore, history } = cfgStore;
const store = configureStore();

function initSteam() {
  let steamworks: Steamworks.API | null;
  try {
    steamworks = window.require('./steamworks');
  } catch (e) {
    console.log('Failed to load steamworks');
    console.error(e);
    steamworks = null;
  }

  if (!steamworks) {
    return;
  }

  console.info(`Initializing Steamworks (Greenworks ${steamworks._version})...`);
  if (steamworks.initAPI()) {
    console.info('Successfully initialized Steamworks');
  } else {
    console.error('Failed to initialize Steamworks');
    electron.remote.app.exit();
    return;
  }

  console.log(steamworks.getFriendCount(steamworks.FriendFlags.Immediate));
  var friends = steamworks.getFriends(steamworks.FriendFlags.Immediate);
  for (var i = 0; i < friends.length; ++i) {
    console.log(`${friends[i].getPersonaName()} [${friends[i].getRawSteamID()}]`);
    steamworks.requestUserInformation(friends[i].getRawSteamID(), true);
  }

  (global as any).steamworks = steamworks;
}

function onRendered() {
  initSteam();
}

function init() {
  render(
    <AppContainer>
      <Root store={store} history={history} />
    </AppContainer>,
    document.getElementById('root'),
    onRendered
  );
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
