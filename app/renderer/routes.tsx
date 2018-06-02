import React from 'react'
import { Switch, Route, Redirect, RouteProps } from 'react-router'

import { hasValidLicense } from 'renderer/license'

import App from './containers/App'
import { HomePage } from './containers/HomePage'
import { ServerBrowserPage } from './containers/ServerBrowserPage'
import { LobbyPage } from './containers/LobbyPage'
import { SessionJoinPage } from './containers/SessionJoinPage'
import { SettingsPage } from './containers/SettingsPage'
import { LicenseGate } from './containers/LicenseGate'
import WelcomePage from './containers/WelcomePage'

export default () => (
  <App>
    <Switch>
      <WelcomeRoute exact path="/" component={HomePage} />
      <LicensedRoute path="/lobby/:lobbyId" component={LobbyPage} />
      <LicensedRoute path="/servers" component={ServerBrowserPage} />
      <LicensedRoute path="/join" component={SessionJoinPage} />
      <LicensedRoute path="/settings" component={SettingsPage} />
      <LicensedRoute path="/license" component={LicenseGate} />
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

// prettier-ignore
const LicensedRoute = ({ component: Component, ...rest }: PrivateRouteProps) => (
  <Route
    {...rest}
    render={props =>
      (process.env.NODE_ENV === 'development' || hasValidLicense()) ? (
        <Component {...props} />
      ) : (
        <LicenseGate {...props} gate />
      )
    }
  />
)
