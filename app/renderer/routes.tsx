import React from 'react'
import { Switch, Route, RouteProps } from 'react-router'

import App from './containers/App'
import { HomePage } from './containers/HomePage'
import { ServerBrowserPage } from './containers/ServerBrowserPage'
import { LobbyPage } from './containers/LobbyPage'
import { SessionJoinPage } from './containers/SessionJoinPage'
import { SettingsPage } from './containers/SettingsPage'
import WelcomePage from './containers/WelcomePage'

export default () => (
  <App>
    <Switch>
      <WelcomeRoute exact path="/" component={HomePage} />
      <Route path="/lobby/:lobbyId" component={LobbyPage} />
      <Route path="/servers" component={ServerBrowserPage} />
      <Route path="/join" component={SessionJoinPage} />
      <Route path="/settings" component={SettingsPage} />
    </Switch>
  </App>
)

interface PrivateRouteProps extends RouteProps {
  component: any
}

// prettier-ignore
const WelcomeRoute = ({ component: Component, ...rest }: PrivateRouteProps) => (
  <Route
    {...rest}
    render={props =>
      localStorage.getItem('welcomed') ? <Component {...props} /> : <WelcomePage {...props} />
    }
  />
)
