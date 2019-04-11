import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IAppState } from 'reducers'
import { listenForUiEvents } from 'actions/ui'
import { PlatformService } from '../platform'
import { localUser } from '../network'
import { setUsername } from '../actions/settings'
import { IReactReduxProps } from 'types/redux-thunk'

interface IConnectedProps {
  developer: boolean
  username?: string
}

type Props = IConnectedProps & IReactReduxProps

class App extends Component<Props> {
  componentWillMount() {
    this.init()
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

export default connect<IConnectedProps, {}, {}, IAppState>((state: IAppState) => {
  return {
    developer: state.settings.developer,
    username: state.settings.username
  }
})(App)
