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
import { sleep } from 'utils/async'
import {
  NETWORK_TIMEOUT,
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

  private async setupLobby(): Promise<void> {
    let successPromise

    if (this.host) {
      successPromise = PlatformService.createLobby({
        p2p: true,
        websocket: true
      })
    } else {
      successPromise = PlatformService.joinLobby(this.lobbyId)
    }

    // TODO: will this reject the promise that loses?
    const result = await Promise.race([successPromise, sleep(NETWORK_TIMEOUT)])
    const success = typeof result === 'boolean' ? result : false
    if (!this.mounted) return

    if (success) {
      this.onJoinLobby(PlatformService.getServer()!)
    } else {
      this.onConnectionFailed()
    }
  }

  private closeLobby() {
    this.setState({ connected: false })

    if (this.server) {
      this.server.removeListener('close', this.disconnect)
      this.server = undefined
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

  private onConnectionFailed(): void {
    this.disconnect(NetworkDisconnectReason.Timeout)
  }

  private disconnect = (
    reason: NetworkDisconnectReason = NetworkDisconnectReason.HostDisconnect,
    immediate?: boolean
  ) => {
    this.setState({ connected: false })

    if (immediate || this.host) {
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
    this.setupLobby();
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
      this.onLeaveScreen()
      this.onLoadScreen()
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
      return <Disconnect
        reason={this.state.disconnectReason}
        reconnect={this.reconnect} />
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
