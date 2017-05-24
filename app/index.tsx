import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import * as cfgStore from './store/configureStore';
import './app.global.css';
import { getRootDir } from "utils/path";

const electron = window.require('electron');
const process = window.require('process');

(global as any).ROOT_DIR = getRootDir();

let store: any;

function initSteam(): Steamworks.API | undefined {
  let steamworks: Steamworks.API;

  // Activate UV loop for async workers
  // https://github.com/greenheartgames/greenworks#general-greenworks-gotchas
  process.activateUvLoop();

  try {
    steamworks = window.require('./steamworks');
  } catch (e) {
    console.log('Failed to load steamworks');
    console.error(e);
    alert(e.message);
    return;
  }

  console.info(`Initializing Steamworks (Greenworks ${steamworks._version})...`);
  if (steamworks.initAPI()) {
    console.info('Successfully initialized Steamworks');
  } else {
    console.error('Failed to initialize Steamworks');
    return;
  }

  // DEBUG
  (global as any).steamworks = steamworks;

  return steamworks;

  /*
  console.log(steamworks.getFriendCount(steamworks.FriendFlags.Immediate));
  var friends = steamworks.getFriends(steamworks.FriendFlags.Immediate);
  for (var i = 0; i < friends.length; ++i) {
    console.log(`${friends[i].getPersonaName()} [${friends[i].getRawSteamID()}]`);
    steamworks.requestUserInformation(friends[i].getRawSteamID(), true);
  }

  steamworks.on('lobby-chat-message', function (lobbyId, userId, chatType, chatId) {
    console.log('received chat message', arguments);

    const entry = steamworks.getLobbyChatEntry(lobbyId.getRawSteamID(), chatId);
    console.log('Entry: ', entry);
    console.log('Message: ', entry.message.toString('utf-8'));
  });

  steamworks.createLobby(steamworks.LobbyType.Public, 16, async (lobbyId) => {
    console.info(`Created lobby [${lobbyId}]`);

    steamworks.setLobbyData(lobbyId, 'game', GAME_GUID);

    steamworks.sendLobbyChatMsg(lobbyId, Buffer.from('Hello world', 'utf-8'));
    await sleep(1000);

    (window as any).requestLobbyList = requestList;
    requestList();
    // steamworks.sendLobbyChatMsg(lobbyId, Buffer.from('Another test', 'utf-8'));
    // await sleep(5000);
    // steamworks.sendLobbyChatMsg(lobbyId, Buffer.from('yay!!1', 'utf-8'));
  });
  */
}

function init() {
  const steamworks = initSteam();

  if (!steamworks) {
    alert('Failed to initialize Steamworks');
    electron.remote.app.exit();
    return;
  }

  const extra = { steamworks };

  const { configureStore, history } = cfgStore;
  store = configureStore(extra);

  render(
    <AppContainer>
      <Root store={store} history={history} />
    </AppContainer>,
    document.getElementById('root'),
    function () {
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
