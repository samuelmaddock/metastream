import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import { ServerBrowserPage } from "containers/ServerBrowserPage";
import { LobbyPage } from "containers/LobbyPage";

export default () => (
  <App>
    <Switch>
      <Route exact path="/" component={ServerBrowserPage} />
      <Route path="/lobby/:lobbyId" component={LobbyPage} />
      <Route path="/home" component={HomePage} />
    </Switch>
  </App>
);
