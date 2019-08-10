import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'

import { IAppState, AppReplicatedState } from 'reducers'

import { GameLobby } from 'components/GameLobby'
import { PlatformService } from 'platform'
import { NetServer, localUserId } from 'network'
import { NetActions } from 'network/actions'
import { ReplicatedState } from 'network/types'
import { push } from 'react-router-redux'
import {
  NetworkDisconnectReason,
  NetworkDisconnectMessages,
  NetworkDisconnectLabels
} from 'constants/network'
import { Connect } from '../components/lobby/Connect'
import { Disconnect } from '../components/lobby/Disconnect'
import { getDisconnectReason, ConnectionStatus } from '../lobby/reducers/session'
import { setDisconnectReason } from '../lobby/actions/session'
import { t } from 'locale'
import { SessionMode } from '../reducers/settings'
import { resetLobby, initLobby } from '../lobby/actions/common'
import { IReactReduxProps } from 'types/redux-thunk'
import { NetworkError, NetworkErrorCode } from '../network/error'
import { addChat } from '../lobby/actions/chat'
import { MultiTabObserver } from '../utils/multitab'
import { safeBrowse } from '../services/safeBrowse'

interface IRouteParams {
  lobbyId: string
}

interface IProps extends RouteComponentProps<IRouteParams> {}

interface IConnectedProps {
  disconnectReason?: NetworkDisconnectReason
  clientAuthorized?: boolean
  sessionMode?: SessionMode
  connectionStatus?: ConnectionStatus
}

interface IState {
  connected: boolean
  disconnectReason?: NetworkDisconnectReason
}

function mapStateToProps(state: IAppState): IConnectedProps {
  return {
    disconnectReason: getDisconnectReason(state),
    clientAuthorized: state.session.authorized,
    sessionMode: state.settings.sessionMode,
    connectionStatus: state.session.connectionStatus
  }
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

/**
 * Component managing lobby connection state.
 */
export class _LobbyPage extends Component<PrivateProps, IState> {
  state: IState = { connected: false }

  private mounted: boolean = false
  private server?: NetServer
  private host: boolean
  private tabObserver?: MultiTabObserver

  private get supportsNetworking() {
    return this.props.sessionMode !== SessionMode.Offline
  }

  private get lobbyId(): string {
    const { match } = this.props
    return match.params.lobbyId
  }

  constructor(props: PrivateProps) {
    super(props)
    this.host = props.match.params.lobbyId === localUserId()
  }

  private async checkIsMultiTab() {
    if (!this.tabObserver) {
      this.tabObserver = new MultiTabObserver()
    }

    const isMultiTab = await this.tabObserver.getIsMultiTab()
    if (isMultiTab) {
      // Destroy while on disconnected screen
      this.tabObserver.destroy()
      this.tabObserver = undefined

      this.disconnect(NetworkDisconnectReason.MultiTab)
      return true
    }

    return false
  }

  private async setupLobby(): Promise<void> {
    let setupPromise

    if (this.host) {
      const isMultiTab = await this.checkIsMultiTab()
      if (isMultiTab) return

      setupPromise = PlatformService.createLobby({
        p2p: true,
        websocket: true
      })
    } else {
      setupPromise = PlatformService.joinLobby(this.lobbyId)
    }

    try {
      await setupPromise
    } catch (e) {
      console.error(e)
      if (!this.mounted) return
      this.onConnectionFailed(e)
      return
    }

    if (!this.mounted) return
    this.onJoinLobby(PlatformService.getServer()!)
  }

  private closeLobby() {
    this.setState({ connected: false })

    if (this.server) {
      this.server.removeListener('close', this.disconnect)
      this.server = undefined
    }

    if (this.tabObserver) {
      this.tabObserver.destroy()
      this.tabObserver = undefined
    }

    PlatformService.leaveLobby(this.lobbyId)
    this.props.dispatch(NetActions.disconnect({ host: this.host }))
  }

  private onJoinLobby(server: NetServer): void {
    this.server = server
    this.server.once('close', this.disconnect)
    this.server.on('error', this.onServerError)

    if (this.host || this.server.connected) {
      // Server is ready
      this.onConnection()
    } else {
      this.onConnectionFailed()
    }
  }

  private onConnection(): void {
    this.props.dispatch(
      NetActions.connect({
        server: this.server,
        host: this.host,
        replicated: AppReplicatedState as ReplicatedState<any>
      })
    )

    this.setState({ connected: true })
  }

  private onConnectionFailed(err?: NetworkError) {
    let reason
    const errorCode = err ? err.errorCode : null
    switch (errorCode) {
      case NetworkErrorCode.UnknownSession:
      case NetworkErrorCode.SignalServerSessionNotFound:
        reason = NetworkDisconnectReason.SessionNotFound
        break
      default:
        reason = NetworkDisconnectReason.Error
    }
    this.disconnect(reason)
  }

  private disconnect = (
    reason: NetworkDisconnectReason = NetworkDisconnectReason.HostDisconnect,
    immediate?: boolean
  ) => {
    this.setState({ connected: false })

    if (immediate) {
      this.props.dispatch(push('/'))
      return
    }

    reason = this.props.disconnectReason || reason
    this.setState({ disconnectReason: reason })

    {
      const reasonKey: any = NetworkDisconnectMessages[reason]
      let msg = t(reasonKey) || reasonKey
      console.debug(`Disconnected [${reason}]: ${msg}`)
    }

    ga('event', { ec: 'session', ea: 'disconnect', el: NetworkDisconnectLabels[reason] })

    // Clear disconnect reason in Redux
    if (this.props.disconnectReason) {
      this.props.dispatch!(setDisconnectReason())
    }
  }

  private disconnectImmediate = (
    reason: NetworkDisconnectReason = NetworkDisconnectReason.HostDisconnect
  ) => {
    this.disconnect(reason, true)
  }

  private reconnect = () => {
    if (this.state.disconnectReason) {
      this.setState({ disconnectReason: undefined })
    }
    this.onLeaveScreen()
    this.onLoadScreen()
  }

  private onLoadScreen() {
    this.host = this.props.match.params.lobbyId === localUserId()
    this.props.dispatch(initLobby({ host: this.host }))

    if (!this.host || this.supportsNetworking) {
      this.setupLobby()
    }
  }

  private onLeaveScreen() {
    this.closeLobby()
    this.props.dispatch(resetLobby({ host: this.host }))

    // always re-enable upon leaving session
    safeBrowse.enable()
  }

  private onServerError = (err: NetworkError) => {
    let content
    switch (err.errorCode) {
      case NetworkErrorCode.SignalServerDisconnect: {
        content = '❌ Disconnected from signal server, reconnecting...'
        break
      }
      case NetworkErrorCode.SignalServerReconnect: {
        content = '✅ Reconnected to signal server.'
        break
      }
      default:
        console.error('Server error:', err)
        break
    }
    if (content) {
      this.props.dispatch(addChat({ content, timestamp: Date.now() }))
    }
  }

  componentWillMount(): void {
    this.onLoadScreen()
  }

  componentDidMount() {
    this.mounted = true
    window.addEventListener('beforeunload', this.beforeUnload, false)
  }

  componentWillUnmount(): void {
    window.removeEventListener('beforeunload', this.beforeUnload, false)
    this.mounted = false
    this.onLeaveScreen()
  }

  componentDidUpdate(prevProps: PrivateProps) {
    if (this.lobbyId !== prevProps.match.params.lobbyId) {
      // Accepted Discord invites can join a session while currently hosting a session
      this.reconnect()
    } else if (this.props.sessionMode !== prevProps.sessionMode) {
      this.onSessionModeChange()
    }
  }

  private onSessionModeChange() {
    if (this.supportsNetworking && !this.state.connected) {
      this.setupLobby()
    } else if (!this.supportsNetworking && this.state.connected) {
      this.closeLobby()
    }
  }

  private beforeUnload = () => {
    this.disconnectImmediate()
  }

  render(): JSX.Element {
    if (this.state.disconnectReason) {
      return <Disconnect reason={this.state.disconnectReason} reconnect={this.reconnect} />
    }

    if (!this.host && !(this.state.connected && this.props.clientAuthorized)) {
      const status =
        this.props.connectionStatus === ConnectionStatus.Pending ? t('waitingForHost') : undefined
      return <Connect onCancel={this.disconnectImmediate} status={status} />
    }

    return <GameLobby host={this.host} />
  }
}

export const LobbyPage = connect<IConnectedProps, {}, IProps, IAppState>(mapStateToProps)(
  _LobbyPage
)
