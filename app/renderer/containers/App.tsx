import React, { Component, Children } from 'react'
import { connect, DispatchProp, Store } from 'react-redux'
import { IAppState } from 'renderer/reducers'
import { listenForUiEvents } from 'renderer/actions/ui'
import { getLocalUsername } from '../reducers/settings';
import { PlatformService } from '../platform/index';
import { localUserId, localUser } from '../network/index';
import { setUsername } from '../actions/settings';

interface IConnectedProps {
  bootstrapped: boolean
  username?: string
}

type Props = IConnectedProps & DispatchProp<IAppState>

class App extends Component<Props> {
  componentDidUpdate(prevProps: Props) {
    // Wait for redux-persist state to rehydrate
    if (!prevProps.bootstrapped && this.props.bootstrapped){
      this.init()
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
  }

  render() {
    return <div className="app">{this.props.children}</div>
  }
}

export default connect((state: IAppState) => {
  return {
    bootstrapped: (state as any)._persist.rehydrated,
    username: state.settings.username
  }
})(App as any)
