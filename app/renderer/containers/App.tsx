import React, { Component, Children } from 'react'
import { connect, DispatchProp, Store } from 'react-redux'
import { IAppState } from 'renderer/reducers'
import { listenForUiEvents } from 'renderer/actions/ui'
import { getLocalUsername } from '../reducers/settings'
import { PlatformService } from '../platform/index'
import { localUserId, localUser } from '../network/index'
import { setUsername } from '../actions/settings'

interface IConnectedProps {
  username?: string
}

type Props = IConnectedProps & DispatchProp<IAppState>

class App extends Component<Props> {
  componentWillMount() {
    this.init()
  }

  private init() {
    this.initSettings()
    this.initAnalytics()
    this.props.dispatch!(listenForUiEvents())
  }

  private initSettings() {
    const { username, dispatch } = this.props

    // Init username
    if (!username) {
      const platformUsername = PlatformService.getUserName(localUser().id)
      dispatch!(setUsername(platformUsername))
    }
  }

  private initAnalytics() {
    const ANALYTICS_ID = 'metastreamAnalytics'
    if (document.getElementById(ANALYTICS_ID)) return

    const script = document.createElement('script')
    script.id = ANALYTICS_ID
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=UA-115004557-2'
    document.head.appendChild(script)
  }

  render() {
    return <div className="app">{this.props.children}</div>
  }
}

export default connect<IConnectedProps>((state: IAppState) => {
  return {
    username: state.settings.username
  }
})(App)
