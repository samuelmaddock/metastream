const { ipcRenderer } = chrome
import React, { Component, Children } from 'react'
import { connect, DispatchProp, Store } from 'react-redux'
import { IAppState } from 'renderer/reducers'
import { listenForUiEvents } from 'renderer/actions/ui'
import { getLocalUsername } from '../reducers/settings'
import { PlatformService } from '../platform/index'
import { localUserId, localUser } from '../network/index'
import { setUsername } from '../actions/settings'

interface IConnectedProps {
  developer: boolean
  username?: string
}

type Props = IConnectedProps & DispatchProp<IAppState>

class App extends Component<Props> {
  private heartbeatIntervalId?: number

  componentWillMount() {
    this.init()
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.developer !== prevProps.developer) {
      this.onDeveloperChanged()
    }
  }

  private init() {
    this.initSettings()
    this.props.dispatch!(listenForUiEvents())
  }

  private initSettings() {
    const { username, dispatch } = this.props

    // Init username
    if (!username) {
      const platformUsername = PlatformService.getUserName(localUser().id)
      dispatch!(setUsername(platformUsername))
    }

    this.onDeveloperChanged()
  }

  private onDeveloperChanged() {
    // Apply developer menu settings
    ipcRenderer.send('menu-rebuild', this.props.developer)
  }

  render() {
    return <div className="app">{this.props.children}</div>
  }
}

export default connect<IConnectedProps, {}, {}, IAppState>((state: IAppState) => {
  return {
    developer: state.settings.developer,
    username: state.settings.username
  }
})(App)
