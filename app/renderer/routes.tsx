import React from 'react'
import { Switch, Route, Redirect, RouteProps } from 'react-router'
import App from './containers/App'
import { HomePage } from './containers/HomePage'
import { ServerBrowserPage } from './containers/ServerBrowserPage'
import { LobbyPage } from './containers/LobbyPage'
import { SessionJoinPage } from './containers/SessionJoinPage'
import { hasValidLicense } from 'renderer/license'

export default () => (
  <App>
    <Switch>
      <LicensedRoute exact path="/" component={HomePage} />
      <LicensedRoute path="/lobby/:lobbyId" component={LobbyPage} />
      <LicensedRoute path="/servers" component={ServerBrowserPage} />
      <LicensedRoute path="/join" component={SessionJoinPage} />
    </Switch>
  </App>
)

interface PrivateRouteProps extends RouteProps {
  component: any
}

// prettier-ignore
const LicensedRoute = ({ component: Component, ...rest }: PrivateRouteProps) => (
  <Route
    {...rest}
    render={props =>
      hasValidLicense() ? (
        <Component {...props} />
      ) : (
        <div>TODO: license page</div>
      )
    }
  />
)
