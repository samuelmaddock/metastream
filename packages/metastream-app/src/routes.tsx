import React from 'react'
import { Switch, Route, RouteProps } from 'react-router'

import App from './containers/App'
import { HomePage } from './containers/HomePage'
import { LobbyPage } from './containers/LobbyPage'
import { SessionJoinPage } from './containers/SessionJoinPage'
import { SettingsPage } from './containers/SettingsPage'
import WelcomePage from './containers/WelcomePage'

export default () => (
  <App>
    <Switch>
      <WelcomeRoute exact path="/" component={HomePage} />
      <WelcomeRoute exact path="/join" component={SessionJoinPage} />
      <WelcomeRoute path="/join/:lobbyId" component={LobbyPage} />
      <WelcomeRoute path="/settings" component={SettingsPage} />
    </Switch>
  </App>
)

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<any>
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
