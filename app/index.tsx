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
  let steamworks: Steamworks.API;
  try {
    steamworks = window.require('./steamworks');
  } catch (e) {
    console.log('Failed to load steamworks');
    console.error(e);
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

  steamworks.on('lobby-chat-message', function (lobbyId, userId, chatType, chatId) {
    console.log('received chat message', arguments);

    const entry = steamworks.getLobbyChatEntry(lobbyId.getRawSteamID(), chatId);
    console.log('Entry: ', entry);
    console.log('Message: ', entry.message.toString('utf-8'));
  });

  const sleep = (time: number) => {
    return new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }

  const GAME_GUID = '328e7911-b879-4846-8fcc-3ba367984e6f';

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

  const getLobbyData = (lobbyId: Steamworks.SteamID) => {
    let data: any = {};
    const numData = steamworks.getLobbyDataCount(lobbyId.getRawSteamID());
    for (let i = 0; i < numData; i++) {
      const [key, value] = steamworks.getLobbyDataByIndex(lobbyId.getRawSteamID(), i);
      data[key] = value;
    }
    return data;
  };

  const requestList = () => {
    steamworks.requestLobbyList({
      filters: [
        // { key: 'mod', value: 'Stellaris', comparator: steamworks.LobbyComparison.Equal },
        // { key: 'status', value: 'STARTING', comparator: steamworks.LobbyComparison.NotEqual },
        { key: 'game', value: GAME_GUID, comparator: steamworks.LobbyComparison.Equal }
      ],
      distance: steamworks.LobbyDistanceFilter.Worldwide,
      count: 50
    }, (count) => {
      console.info('Received lobby list', count);

      let lobbies: any = {};

      for (let i = 0; i < count; i++) {
        const lobby = steamworks.getLobbyByIndex(i);
        lobbies[lobby.getRawSteamID()] = getLobbyData(lobby);
      }

      console.log(lobbies);
    });
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
