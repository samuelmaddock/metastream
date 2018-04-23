import React, { Component, Children } from 'react'
import { connect, DispatchProp, Store } from 'react-redux'
import { IAppState } from 'renderer/reducers'
import { listenForUiEvents } from 'renderer/actions/ui'
import { getLocalUsername } from '../reducers/settings'
import { PlatformService } from '../platform/index'
import { localUserId, localUser } from '../network/index'
import { setUsername } from '../actions/settings'
import { Analytics } from 'renderer/analytics'
import appJson from 'package.json'

interface IConnectedProps {
  username?: string
}

type Props = IConnectedProps & DispatchProp<IAppState>

class App extends Component<Props> {
  private heartbeatIntervalId?: number

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
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId)
      this.heartbeatIntervalId = undefined
    }

    // TODO: check for opt-out setting
    const allowTracking = true

    if (!allowTracking) {
      window.ga = () => {}
      return
    }

    // https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
    const analytics = new Analytics('UA-115004557-2', {
      appName: appJson.productName,
      appVersion: appJson.version,
      clientId: localUserId()
    })

    window.ga = (...args: any[]) => {
      try {
        analytics.send(...args)
      } catch (e) {
        console.error(e)
      }
    }

    this.heartbeatIntervalId = (setInterval(() => {
      ga('event', { ec: 'app', ea: 'heartbeat', ni: 1 })
    }, 10 * 60 * 1000) as any) as number
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
