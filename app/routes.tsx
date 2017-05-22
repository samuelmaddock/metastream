import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import { ServerBrowserPage } from "containers/ServerBrowserPage";

export default () => (
  <App>
    <Switch>
      <Route path="/" component={ServerBrowserPage} />
      <Route path="/home" component={HomePage} />
    </Switch>
  </App>
);
