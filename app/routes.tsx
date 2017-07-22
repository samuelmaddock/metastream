import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import { HomePage } from './containers/HomePage';
import { ServerBrowserPage } from "containers/ServerBrowserPage";
import { LobbyPage } from "containers/LobbyPage";
import { P2PLobbyPage } from "containers/P2PLobbyPage";
import { MultiplayerTestPage } from "containers/MultiplayerTestPage";

export default () => (
  <App>
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route path="/lobby/dev" component={P2PLobbyPage} />
      <Route path="/lobby/:lobbyId" component={LobbyPage} />
      <Route path="/servers" component={ServerBrowserPage} />
      <Route path="/mptest" component={MultiplayerTestPage} />
    </Switch>
  </App>
);
